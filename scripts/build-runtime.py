"""Rebuild the versioned Windows runtimes. Never creates a distribution ZIP."""
import argparse
import os
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
GO_VERSION = 'go1.27.4'
ARCHITECTURES = {'amd64': 'x64', '386': 'x86', 'arm64': 'arm64'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--go', default='go')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    env = os.environ | {'CGO_ENABLED': '0', 'GOENV': 'off', 'GOFLAGS': '',
                        'GOPROXY': 'off', 'GOTOOLCHAIN': 'local', 'GOWORK': 'off'}
    version = subprocess.check_output([args.go, 'env', 'GOVERSION'], env=env, text=True).strip()
    if version != GO_VERSION:
        raise RuntimeError(f'Se necesita {GO_VERSION}; se encontro {version}.')
    goroot = Path(subprocess.check_output([args.go, 'env', 'GOROOT'], env=env, text=True).strip())
    with TemporaryDirectory() as temp:
        outputs = {}
        for arch, label in ARCHITECTURES.items():
            binary = Path(temp) / f'CarsMotion-{label}.exe'
            subprocess.run([args.go, 'build', '-trimpath', '-buildvcs=false',
                            '-ldflags=-s -w', '-o', str(binary), '.'],
                           cwd=ROOT / 'scripts/portable', check=True,
                           env=env | {'GOOS': 'windows', 'GOARCH': arch,
                                      'GOAMD64': 'v1', 'GOARM64': 'v8.0', 'GO386': 'sse2'})
            outputs[ROOT / 'runtime' / binary.name] = binary
        for notice in ('LICENSE', 'PATENTS'):
            outputs[ROOT / f'licencias/Go-{notice}.txt'] = goroot / notice
            for library in ('crypto', 'net', 'sys', 'text'):
                outputs[ROOT / f'licencias/Go-x-{library}-{notice}.txt'] = (
                    goroot / 'src/vendor/golang.org/x' / library / notice)
        # Read every result before changing a tracked file.
        contents = {dest: source.read_bytes() for dest, source in outputs.items()}
        for dest, data in contents.items():
            if args.check:
                if not dest.is_file() or dest.read_bytes() != data:
                    raise RuntimeError(f'No coincide con su fuente: {dest.relative_to(ROOT)}')
            else:
                dest.parent.mkdir(exist_ok=True)
                dest.write_bytes(data)
        print('Tres ejecutables y licencias ' + ('reproducidos exactamente.' if args.check else 'actualizados.'))


if __name__ == '__main__':
    main()
