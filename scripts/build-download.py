"""Build the portable site and refresh hashes, or verify a reproducible delivery."""
import argparse
from hashlib import sha256
import os
from pathlib import Path
import subprocess
import sys

from offline_launcher import launcher

ROOT = Path(__file__).resolve().parents[1]


def snapshot():
    return {p.relative_to(ROOT / 'dist').as_posix(): sha256(p.read_bytes()).hexdigest()
            for p in (ROOT / 'dist').rglob('*') if p.is_file()}


def build():
    # Vite empties its output directory before writing the new build.
    subprocess.run(['npm.cmd' if os.name == 'nt' else 'npm', 'run', 'build'],
                   cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='Require dist to match two fresh builds; never refresh hashes')
    args = parser.parse_args()
    before = snapshot()
    build()
    first = snapshot()
    if args.check:
        changed = sorted(name for name in before.keys() | first.keys()
                         if before.get(name) != first.get(name))
        if changed:
            raise RuntimeError('dist no coincide con el codigo fuente: ' + ', '.join(changed))
        build()
        if snapshot() != first:
            raise RuntimeError('La segunda compilacion no reproduce la primera')
    cmd = ROOT / 'Abrir CarsMotion.cmd'
    generated = launcher(ROOT)
    if args.check:
        if generated != cmd.read_bytes():
            raise RuntimeError('La copia autonoma del lanzador no coincide con dist')
    else:
        cmd.write_bytes(generated)
    command = [sys.executable, 'scripts/check-download.py']
    if not args.check:
        command.append('--refresh')
    subprocess.run(command, cwd=ROOT, check=True)
    print('OK: ' + ('dos compilaciones identicas al dist entregado.' if args.check
                    else 'dist limpio y SHA256SUMS.txt actualizados juntos.'))


if __name__ == '__main__':
    main()
