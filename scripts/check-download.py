"""Check the files that must be in Code > Download ZIP, without dependencies."""
import argparse
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import re
import struct
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ARCHITECTURES = {'x64': (0x8664, b'amd64'), 'x86': (0x14c, b'386'), 'arm64': (0xaa64, b'arm64')}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def payload(root):
    files = ['Abrir CarsMotion.cmd', 'LEEME.txt']
    for folder in ('dist', 'runtime', 'licencias'):
        require((root / folder).is_dir(), f'Falta {folder}/')
        for file in sorted((root / folder).rglob('*')):
            require(not file.is_symlink(), f'Enlace no portable: {file}')
            if file.is_file():
                files.append(file.relative_to(root).as_posix())
    return sorted(files)


def verify(root, refresh=False, git=False):
    files = payload(root)
    require('dist/index.html' in files, 'Falta dist/index.html')
    notices = ['Inter-OFL.txt', 'GSAP-README.md', 'GSAP-package.json',
               'Cardog-LICENSE.txt', 'Vite-LICENSE.md']
    notices += [f'Go{library}-{notice}.txt' for library in ('', '-x-crypto', '-x-net', '-x-sys', '-x-text')
                for notice in ('LICENSE', 'PATENTS')]
    for notice in notices:
        require(f'licencias/{notice}' in files, f'Falta el aviso de redistribucion: {notice}')
    for name in ['index.html', 'src/main.js', 'src/style.css', 'package.json',
                 'package-lock.json', 'vite.config.js', 'README.md']:
        require((root / name).is_file(), f'Falta el codigo o la documentacion: {name}')
    for arch, (machine, goarch) in ARCHITECTURES.items():
        name = f'runtime/CarsMotion-{arch}.exe'
        require(name in files, f'Falta {name}')
        data = (root / name).read_bytes()
        require(data[:2] == b'MZ', f'{name}: no es un ejecutable, posiblemente es un puntero LFS')
        pe = struct.unpack_from('<I', data, 0x3c)[0]
        require(data[pe:pe + 4] == b'PE\0\0', f'{name}: PE invalido')
        require(struct.unpack_from('<H', data, pe + 4)[0] == machine, f'{name}: arquitectura incorrecta')
        require(b'build\tGOOS=windows' in data and b'build\tGOARCH=' + goarch + b'\n' in data,
                f'{name}: destino Go incorrecto')
        require(b'build\tCGO_ENABLED=0' in data, f'{name}: dependencia CGO inesperada')
        require(struct.unpack_from('<HH', data, pe + 24 + 40) == (10, 0), f'{name}: minimo de Windows inesperado')
    cmd = (root / 'Abrir CarsMotion.cmd').read_bytes()
    require(b'\r\n' in cmd and b'\n' not in cmd.replace(b'\r\n', b''), 'El .cmd debe estar guardado con CRLF')
    require(b'npm ' not in cmd and b'node ' not in cmd, 'El lanzador no debe invocar npm ni Node')

    def asset(reference, parent):
        parsed = urlsplit(reference)
        require(not parsed.netloc and parsed.scheme in ('', 'data'), f'Recurso remoto: {reference}')
        if parsed.scheme == 'data' or not parsed.path:
            return
        target = ((root / 'dist') if parsed.path.startswith('/') else parent) / unquote(parsed.path.lstrip('/'))
        require(target.resolve().is_relative_to((root / 'dist').resolve()), f'Recurso fuera de dist: {reference}')
        require(target.is_file(), f'Recurso faltante: {target}')

    class Resources(HTMLParser):
        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            for key in ('src', 'poster'):
                if a.get(key):
                    asset(a[key], root / 'dist')
            if tag == 'link' and a.get('href'):
                asset(a['href'], root / 'dist')
            if a.get('srcset'):
                for entry in a['srcset'].split(','):
                    asset(entry.strip().split()[0], root / 'dist')
    Resources().feed((root / 'dist/index.html').read_text(encoding='utf-8'))
    for css in (root / 'dist').rglob('*.css'):
        for reference in re.findall(r'url\([\s\"\']*([^\)\"\']+)', css.read_text(encoding='utf-8')):
            asset(reference.strip(), css.parent)
    for js in (root / 'dist').rglob('*.js'):
        for reference in re.findall(r'[\"\'](\.?/?media/[^\"\']+)[\"\']', js.read_text(encoding='utf-8')):
            asset(reference, root / 'dist')
    for public in (root / 'public').rglob('*'):
        if public.is_file():
            copied = root / 'dist' / public.relative_to(root / 'public')
            require(copied.is_file() and copied.read_bytes() == public.read_bytes(), f'Recurso desactualizado: {copied}')

    manifest = ''.join(f'{sha256((root / name).read_bytes()).hexdigest()}  {name}\n' for name in files)
    if refresh:
        (root / 'SHA256SUMS.txt').write_text(manifest, encoding='utf-8', newline='\n')
    require((root / 'SHA256SUMS.txt').read_text(encoding='utf-8') == manifest, 'SHA256SUMS.txt desactualizado')
    if git:
        required = files + ['SHA256SUMS.txt', 'README.md']
        tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'))
        require(set(required) <= tracked, 'Faltan archivos en Git: ' + ', '.join(sorted(set(required) - tracked)))
        paths = '\0'.join(required) + '\0'
        result = subprocess.run(['git', 'check-ignore', '--no-index', '-v', '-n', '-z', '--stdin'],
                                cwd=root, input=paths, text=True, capture_output=True)
        require(result.returncode in (0, 1), result.stderr)
        parts = result.stdout.split('\0')[:-1]
        for source, line, pattern, name in zip(*[iter(parts)] * 4):
            require(not pattern or pattern.startswith('!'), f'{name}: ignorado por {source}:{line}: {pattern}')
        # Include ancestors: export-ignore on a directory drops its entire subtree.
        attrpaths = '\0'.join(required + ['dist', 'runtime', 'licencias']) + '\0'
        attrs = subprocess.check_output(['git', 'check-attr', '-z', '--stdin', 'export-ignore', 'filter'],
                                        cwd=root, input=attrpaths.encode()).decode().split('\0')[:-1]
        for name, attribute, value in zip(*[iter(attrs)] * 3):
            require(value in ('unset', 'unspecified'), f'{name}: {attribute}={value} altera el ZIP')
        staged = subprocess.check_output(['git', 'diff', '--name-only', '--', *required], cwd=root).decode()
        require(not staged.strip(), 'Hay archivos de entrega modificados sin agregar a Git: ' + staged)
    print(f'OK: {len(files)} archivos de ejecucion, recursos locales, PE x64/x86/ARM64 y SHA-256' + (' incluidos en Git.' if git else '.'))
    return dict(line.split('  ', 1)[::-1] for line in manifest.splitlines())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--git', action='store_true')
    args = parser.parse_args()
    verify(args.root.resolve(), args.refresh, args.git)
