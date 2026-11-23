"""Build the self-contained fallback used when Explorer extracts only the CMD."""
import base64
from hashlib import sha256
from io import BytesIO
import re
from zipfile import ZipFile, ZipInfo


def launcher(root):
    dist = root / 'dist'
    index = (dist / 'index.html').read_text(encoding='utf-8')
    modules = set()

    # Local files can run inline modules. External module scripts require HTTP.
    def inline_module(match):
        modules.add((dist / match[1]).resolve())
        script = (dist / match[1]).read_text(encoding='utf-8')
        return '<script type="module">' + script.replace('</script', r'<\/script') + '</script>'

    index, count = re.subn(r'<script type="module" crossorigin src="([^"]+)"></script>',
                           inline_module, index)
    if count != 1:
        raise ValueError('No se encontro el modulo de entrada de la pagina')
    index = index.replace('<link rel="stylesheet" crossorigin ', '<link rel="stylesheet" ')
    data = BytesIO()
    with ZipFile(data, 'w') as archive:
        files = (p for p in dist.rglob('*') if p.is_file())
        for path in sorted(files, key=lambda p: p.relative_to(dist).as_posix()):
            name = path.relative_to(dist).as_posix()
            if path.resolve() in modules:
                continue  # the entry module is already inside index.html
            info = ZipInfo(name)
            info.create_system = 0
            contents = index.encode() if name == 'index.html' else path.read_bytes()
            archive.writestr(info, contents)
    raw = data.getvalue()
    header = (root / 'scripts/launcher.cmd.in').read_text(encoding='ascii')
    header = header.replace('@DIGEST@', sha256(raw).hexdigest())
    encoded = base64.b64encode(raw).decode('ascii')
    lines = (encoded[i:i + 120] for i in range(0, len(encoded), 120))
    script = header + '\n'.join(lines) + '\n'
    return script.replace('\n', '\r\n').encode('ascii')
