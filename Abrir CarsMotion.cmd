@echo off
setlocal EnableExtensions DisableDelayedExpansion
title CarsMotion - Vista local

if not exist "%~dp0dist\index.html" goto :missing
set "CARSMOTION_ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "CARSMOTION_ARCH=%PROCESSOR_ARCHITEW6432%"
if /i "%CARSMOTION_ARCH%"=="AMD64" goto :amd64
if /i "%CARSMOTION_ARCH%"=="ARM64" goto :arm64
if /i "%CARSMOTION_ARCH%"=="x86" goto :x86

echo Error: esta arquitectura de Windows no es compatible.
goto :error

:amd64
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-x64.exe"
goto :launch

:arm64
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-arm64.exe"
goto :launch

:x86
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-x86.exe"

:launch
if not exist "%CARSMOTION_SERVER%" goto :missing
"%CARSMOTION_SERVER%"
if "%ERRORLEVEL%"=="0" exit /b 0
echo.
echo Error: CarsMotion no pudo iniciarse o se cerro de forma inesperada.
goto :error

:missing
echo No se encontro la pagina o el servidor junto a este lanzador.
echo Si abriste el .cmd dentro del ZIP, Windows puede haber copiado solo este archivo.
echo Arrastra aqui el ZIP de CarsMotion y pulsa Enter para extraerlo en una carpeta nueva.
echo Tambien podes usar Code - Download ZIP y elegir Extraer todo en el Explorador.
set "CARSMOTION_ZIP="
set /p "CARSMOTION_ZIP=Ruta del ZIP (Enter para salir): "
if not defined CARSMOTION_ZIP exit /b 1
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -Command ^
  "$ErrorActionPreference='Stop'; try {" ^
  "$zip=Get-Item -LiteralPath ($env:CARSMOTION_ZIP.Trim().Trim([char]34)); if ($zip.Extension -ne '.zip') {throw 'Selecciona un archivo ZIP.'};" ^
  "Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive=[IO.Compression.ZipFile]::OpenRead($zip.FullName); try {" ^
  "$launch=@($archive.Entries | Where-Object {$_.FullName -match '^[^/]+/Abrir CarsMotion[.]cmd$'}); if ($launch.Count -ne 1) {throw 'El ZIP no contiene el proyecto CarsMotion.'};" ^
  "$root=$launch[0].FullName.Split('/')[0]; foreach ($file in 'dist/index.html','runtime/CarsMotion-x64.exe','runtime/CarsMotion-x86.exe','runtime/CarsMotion-arm64.exe') {if (!$archive.GetEntry($root+'/'+$file)) {throw ('Falta '+$file+' en el ZIP.')}};" ^
  "} finally {$archive.Dispose()}; $dest=Join-Path $zip.DirectoryName ('CarsMotion extraido '+[guid]::NewGuid().ToString('N').Substring(0,12));" ^
  "[IO.Compression.ZipFile]::ExtractToDirectory($zip.FullName,$dest); $folder=Join-Path $dest $root; Write-Host ('Listo. Abri Abrir CarsMotion.cmd en: '+$folder);" ^
  "if (![Console]::IsInputRedirected) {Invoke-Item -LiteralPath $folder}; exit 0 } catch {Write-Host $_.Exception.Message; exit 1}"
if errorlevel 1 goto :error
exit /b 0

:error
echo.
pause
exit /b 1
