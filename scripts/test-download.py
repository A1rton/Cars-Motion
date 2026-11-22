"""Test a GitHub source ZIP in a fresh extraction, without rebuilding it."""
import argparse
from hashlib import sha256
import http.client
import os
from pathlib import Path
from queue import Empty, Queue
import re
import runpy
import subprocess
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import quote, urlsplit
from zipfile import ZipFile

def address_from_output(process):
    lines = Queue()

    def capture():
        for line in process.stdout:
            lines.put(line)
        lines.put(None)

    Thread(target=capture, daemon=True).start()
    output = []
    try:
        for line in iter(lambda: lines.get(timeout=30), None):
            output.append(line)
            if match := re.search(r"http://127\.0\.0\.1:\d+/", line):
                return match[0]
    except Empty:
        pass
    raise RuntimeError("El lanzador no informó la dirección local.\n" + "".join(output))


def verify_http(url, manifest):
    address = urlsplit(url)
    with_connection = http.client.HTTPConnection(address.hostname, address.port, timeout=20)
    try:
        for name, digest in manifest.items():
            if name.startswith("dist/"):
                with_connection.request("GET", "/" + quote(name.removeprefix("dist/")))
                response = with_connection.getresponse()
                assert response.status == 200, (name, response.status)
                assert sha256(response.read()).hexdigest() == digest, name
        for method, path, code in (
            ("HEAD", "/", 200), ("POST", "/", 405), ("GET", "/assets/", 404),
            ("GET", "/../LEEME.txt", 404), ("GET", "/%2e%2e%5cLEEME.txt", 404),
        ):
            with_connection.request(method, path)
            response = with_connection.getresponse()
            assert response.status == code, (method, path, response.status)
            response.read()
        with_connection.request("GET", "/", headers={"Host": "example.invalid"})
        response = with_connection.getresponse()
        assert response.status == 400
        response.read()
    finally:
        with_connection.close()


def verify_brand_navigation(page):
    from playwright.sync_api import expect

    previous = page.locator(".brand-prev")
    following = page.locator(".brand-next")
    track = page.locator("#brand-track")
    at_start = "track => track.scrollLeft < 2"
    at_end = "track => track.scrollWidth - track.clientWidth - track.scrollLeft < 2"
    expect(previous).to_have_attribute("aria-disabled", "true")
    assert track.evaluate(at_start)
    # Walk both directions. Narrow screens need more than one press per trip.
    for button, boundary in ((following, at_end), (previous, at_start)):
        for _ in range(9):
            if button.get_attribute("aria-disabled") == "true":
                break
            before = track.evaluate("track => track.scrollLeft")
            track.evaluate("""track => {
                window.brandScrollFinished = false;
                track.addEventListener('scrollend', () => { window.brandScrollFinished = true },
                                       {once: true});
            }""")
            button.click()
            page.wait_for_function("window.brandScrollFinished")
            after = track.evaluate("track => track.scrollLeft")
            assert after > before if button is following else after < before
        expect(button).to_have_attribute("aria-disabled", "true")
        page.wait_for_function(f"({boundary})(document.querySelector('#brand-track'))")


def verify_browser_context(context, url):
    from playwright.sync_api import expect
    failures = []
    def local_requests_only(route):
        if route.request.url.startswith(url):
            route.continue_()
        else:
            failures.append(f"Recurso externo: {route.request.url}")
            route.abort()

    context.route("**/*", local_requests_only)
    page = context.new_page()
    page.on("pageerror", lambda error: failures.append(str(error)))
    page.on("requestfailed", lambda request: failures.append(f"Solicitud fallida: {request.url}"))
    page.on("response", lambda response: failures.append(f"HTTP {response.status}: {response.url}")
            if response.status >= 400 else None)
    page.goto(url)
    page.wait_for_function("document.querySelector('#year').textContent === String(new Date().getFullYear())")
    page.wait_for_function("""async () => {
        const fonts = await document.fonts.load('400 16px "Inter Variable"');
        return fonts.length > 0 && fonts.every(font => font.status === 'loaded');
    }""")
    page.locator("img[loading=lazy]").evaluate_all("(images) => images.forEach(img => img.loading = 'eager')")
    page.wait_for_function("""Array.from(document.images)
        .filter(img => img.hasAttribute('src'))
        .every(img => img.complete && img.naturalWidth > 0)""")

    brands = ("Porsche", "Lexus", "Mercedes-Benz", "Alfa Romeo", "BMW",
              "Volvo", "DS Automobiles", "Audi", "Jeep")
    expect(page.locator(".brand-button")).to_have_count(len(brands))
    verify_brand_navigation(page)
    for brand in brands:
        page.get_by_role("button", name=f"Ver autos {brand}", exact=True).click()
        expect(page.locator("#future-title")).to_have_text(f"Autos {brand}")
        page.keyboard.press("Escape")
    expect(page.locator('[data-page="login"]')).to_have_count(0)

    for key, count in (("all", 6), ("sedan", 1), ("compact", 1), ("suv", 1), ("sport", 3)):
        page.locator(f'.filter[data-filter="{key}"]').click()
        expect(page.locator('.vehicle-tile:visible')).to_have_count(count)
    for key in ("nosotros", "autos", "contacto"):
        page.locator(f'.navigation [data-page="{key}"]').click()
        expect(page.locator('.future-dialog')).to_be_visible()
        page.keyboard.press("Escape")

    page.locator(".filter[data-filter=sport]").click()
    expect(page.locator(".vehicle-tile:visible")).to_have_count(3)
    page.locator(".vehicle-tile:visible").first.click()
    expect(page.locator(".image-dialog")).to_be_visible()
    image = page.locator("#expanded-image")
    expect(image).to_have_attribute("src", re.compile("porsche-alpine-1600.webp"))
    page.locator("#image-next").click()
    expect(image).to_have_attribute("src", re.compile("lexus-1600.webp"))
    page.wait_for_function("document.querySelector('#expanded-image').naturalWidth > 0")
    page.keyboard.press("ArrowLeft")
    expect(image).to_have_attribute("src", re.compile("porsche-alpine-1600.webp"))
    page.wait_for_function("document.querySelector('#expanded-image').naturalWidth > 0")
    page.keyboard.press("Escape")
    expect(page.locator(".image-dialog")).to_be_hidden()
    page.locator("#motion-toggle").click()
    expect(page.locator("html")).to_have_class(re.compile("motion-paused"))
    page.locator("#motion-toggle").click()
    expect(page.locator("html")).not_to_have_class(re.compile("motion-paused"))

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(url)
    verify_brand_navigation(page)
    menu = page.locator(".menu-toggle")
    menu.click()
    expect(menu).to_have_attribute("aria-expanded", "true")
    page.locator(".mobile-navigation [data-page='contacto']").click()
    expect(menu).to_have_attribute("aria-expanded", "false")
    expect(page.locator("#future-title")).to_have_text("Pronto vamos a estar más cerca.")
    page.keyboard.press("Escape")
    expect(page.locator(".future-dialog")).to_be_hidden()
    assert not failures, failures


def verify_browser(url, executable):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as driver:
        browser = driver.chromium.launch(
            executable_path=executable,
            channel=None if executable else "msedge",
            # context.route blocks nonlocal requests. The dead proxy also
            # intercepted loopback in Edge on the Windows CI runners.
            args=["--no-proxy-server"],
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900},
                                      service_workers="block", reduced_motion="no-preference")

        verify_browser_context(context, url)
        context.close()
        hero_checks = runpy.run_path(str(Path(__file__).with_name('test-hero.py')))
        hero_checks['verify_hero'](browser, url)
        browser.close()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip', type=Path)
    parser.add_argument('--browser', help='Optional browser executable; CI uses installed Edge')
    parser.add_argument('--http-only', action='store_true')
    parser.add_argument('--architecture', choices=['native', 'x86'], default='native')
    parser.add_argument('--local-server', type=Path, help='Linux build, for explicitly partial HTTP-only QA')
    args = parser.parse_args()
    with TemporaryDirectory(prefix='CarsMotion prueba Ñ & ! ') as temporary:
        root = Path(temporary)
        with ZipFile(args.zip) as archive:
            for name in archive.namelist():
                dest = (root / name).resolve()
                if not dest.is_relative_to(root.resolve()):
                    raise RuntimeError('Ruta fuera de la extraccion')
            archive.extractall(root)
        packages = [p for p in root.iterdir() if p.is_dir() and (p / 'Abrir CarsMotion.cmd').is_file()]
        if len(packages) != 1:
            raise RuntimeError('El archivo no es un ZIP fuente de GitHub con una sola carpeta raiz')
        package = packages[0]
        # Use this checkout's verifier, not executable code from an arbitrary ZIP.
        verifier = runpy.run_path(str(Path(__file__).with_name('check-download.py')))
        manifest = verifier['verify'](package)
        outside = root / 'otra carpeta de trabajo'
        outside.mkdir()
        if os.name == 'nt':
            system = Path(os.environ['SystemRoot'])
            cmd = system / 'System32/cmd.exe'
            env = os.environ | {'PATH': f'{cmd.parent};{system}'}
            if args.architecture == 'x86':
                env['PROCESSOR_ARCHITECTURE'] = 'x86'
                env.pop('PROCESSOR_ARCHITEW6432', None)
            command = f'"{cmd}" /d /s /v:off /c ""{package / "Abrir CarsMotion.cmd"}""'
            for name in ('node.exe', 'npm.cmd'):
                assert subprocess.run([str(cmd.parent / 'where.exe'), name], env=env,
                                      cwd=outside, capture_output=True).returncode != 0
            # Missing extraction must give a useful Code > Download ZIP error.
            missing = outside / 'Abrir CarsMotion.cmd'
            missing.write_bytes((package / missing.name).read_bytes())
            result = subprocess.run(f'"{cmd}" /d /s /c ""{missing}""', cwd=outside, env=env,
                                    stdin=subprocess.DEVNULL, capture_output=True, timeout=15)
            assert result.returncode == 1 and b'Code - Download ZIP' in result.stdout
        else:
            import shutil
            if not args.local_server or not args.http_only:
                parser.error('Fuera de Windows solo se admite --local-server con --http-only; no prueba el .cmd.')
            local_server = package / 'runtime/CarsMotion-linux'
            shutil.copy2(args.local_server, local_server)
            command = [str(local_server), '--no-open']
            env = os.environ | {'PATH': '/nonexistent'}
        with subprocess.Popen(command, env=env, cwd=outside, stdin=subprocess.DEVNULL,
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                              errors='replace') as app:
            try:
                url = address_from_output(app)
                verify_http(url, manifest)
                if not args.http_only:
                    verify_browser(url, args.browser)
            finally:
                if os.name == 'nt':
                    subprocess.run([str(cmd.parent / 'taskkill.exe'), '/PID', str(app.pid), '/T', '/F'],
                                   capture_output=True, timeout=20)
                else:
                    app.terminate()
        print('Extraccion nueva y HTTP de todos los recursos: OK.')
        print('Lanzador Windows: ' + ('OK.' if os.name == 'nt' else 'NO PROBADO (Linux).'))
        print('Navegador sin recursos externos: ' + ('NO EJECUTADO.' if args.http_only else 'OK.'))


if __name__ == '__main__':
    main()
