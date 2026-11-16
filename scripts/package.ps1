param([switch]$Force)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\', '/')
$deliveryRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '..'))
$archivePath = Join-Path $deliveryRoot 'CarsMotion-Web.zip'
$temporaryPath = Join-Path $deliveryRoot ('CarsMotion-Web.' + [guid]::NewGuid().ToString('N') + '.tmp.zip')
$pathPrefix = $projectRoot + [System.IO.Path]::DirectorySeparatorChar
$entryPrefix = 'carsmotion-web/'

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/index.html') -PathType Leaf)) {
    throw 'Falta dist/index.html. Ejecutá npm run build antes de empaquetar.'
}
if ((Test-Path -LiteralPath $archivePath) -and -not $Force) {
    throw 'CarsMotion-Web.zip ya existe. Usá -Force para reemplazar ese archivo de entrega.'
}

function Get-StreamSha256([System.IO.Stream]$Stream) {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($Stream))).Replace('-', '').ToLowerInvariant() }
    finally { $algorithm.Dispose() }
}

$rootFiles = @('index.html', 'package.json', 'package-lock.json', 'vite.config.js', '.gitignore', 'README.md', 'Abrir CarsMotion.cmd')
$includedDirectories = @('src', 'public', 'dist', 'docs', 'scripts')
$files = @()
foreach ($name in $rootFiles) {
    $filePath = Join-Path $projectRoot $name
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) { throw "Falta el archivo requerido: $name" }
    $files += Get-Item -LiteralPath $filePath
}
foreach ($name in $includedDirectories) {
    $directoryPath = Join-Path $projectRoot $name
    if (-not (Test-Path -LiteralPath $directoryPath -PathType Container)) { throw "Falta la carpeta requerida: $name" }
    $files += Get-ChildItem -LiteralPath $directoryPath -Recurse -File -Force
}
$files = @($files | Sort-Object FullName -Unique)
$expected = @{}

foreach ($file in $files) {
    $resolvedPath = [System.IO.Path]::GetFullPath($file.FullName)
    if (-not $resolvedPath.StartsWith($pathPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Archivo fuera de la carpeta del proyecto: $resolvedPath"
    }
    if (($file.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "No se empaquetan enlaces de archivos: $resolvedPath"
    }
    $relative = $resolvedPath.Substring($pathPrefix.Length).Replace('\', '/')
    if ($relative -match '(^|/)(node_modules|\.work|\.git)(/|$)') { continue }
    $stream = [System.IO.File]::OpenRead($resolvedPath)
    try { $hash = Get-StreamSha256 $stream } finally { $stream.Dispose() }
    $expected[$entryPrefix + $relative] = @{ Path = $resolvedPath; Sha256 = $hash; Length = $file.Length }
}

try {
    $archive = [System.IO.Compression.ZipFile]::Open($temporaryPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($entryName in @($expected.Keys | Sort-Object)) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, $expected[$entryName].Path, $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
        $manifest = ($expected.Keys | Sort-Object | ForEach-Object {
            $expected[$_].Sha256 + '  ' + $_.Substring($entryPrefix.Length)
        }) -join "`n"
        $manifestEntry = $archive.CreateEntry($entryPrefix + 'SHA256SUMS.txt')
        $writer = [System.IO.StreamWriter]::new($manifestEntry.Open(), [System.Text.UTF8Encoding]::new($false))
        try { $writer.Write($manifest + "`n") } finally { $writer.Dispose() }
    } finally { $archive.Dispose() }

    $archive = [System.IO.Compression.ZipFile]::OpenRead($temporaryPath)
    try {
        if ($archive.Entries.Count -ne ($expected.Count + 1)) { throw 'Cantidad inesperada de archivos dentro del ZIP.' }
        foreach ($entry in $archive.Entries) {
            if ($entry.FullName -eq ($entryPrefix + 'SHA256SUMS.txt')) { continue }
            if (-not $expected.ContainsKey($entry.FullName)) { throw "Entrada inesperada: $($entry.FullName)" }
            $record = $expected[$entry.FullName]
            if ($entry.Length -ne $record.Length) { throw "Tamaño diferente: $($entry.FullName)" }
            $stream = $entry.Open()
            try { $actualHash = Get-StreamSha256 $stream } finally { $stream.Dispose() }
            if ($actualHash -ne $record.Sha256) { throw "Contenido diferente: $($entry.FullName)" }
        }
    } finally { $archive.Dispose() }

    # Both paths are fixed files under the checked delivery directory. No
    # recursive delete/move, staging-tree cleanup, or source modification occurs.
    if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
    Move-Item -LiteralPath $temporaryPath -Destination $archivePath
    $result = Get-Item -LiteralPath $archivePath
    [pscustomobject]@{
        Archive = $result.FullName
        FilesVerified = $expected.Count
        Entries = $expected.Count + 1
        Bytes = $result.Length
        Sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    } | ConvertTo-Json
} finally {
    if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -Force }
}
