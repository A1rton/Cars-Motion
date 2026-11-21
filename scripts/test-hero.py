"""Regression checks for the cinematic hero against a running local preview.

Usage: python scripts/test-hero.py http://127.0.0.1:4270/
Requires Playwright on the test machine; the website itself has no dependency
on these tools. This suite observes rendered transforms, not GSAP internals.
"""
import argparse
import math
from pathlib import Path
from urllib.parse import urlsplit


OBSERVE = r"""(() => {
  const samples = [];
  window.__heroObservation = { samples, done: false };
  let readyAt;
  const started = performance.now();
  const matrix = element => new DOMMatrixReadOnly(getComputedStyle(element).transform);
  function frame(now) {
    const car = document.querySelector('.hero-car');
    const stage = document.querySelector('.hero-car-stage');
    const title = document.querySelector('.title-line > span');
    const wheels = [...document.querySelectorAll('.hero-wheel')];
    if (car && stage && title && wheels.length === 2) {
      const ready = stage.dataset.carReady === 'true';
      if (ready && readyAt === undefined) readyAt = now;
      samples.push({
        t: now, ready, x: matrix(car).m41, titleY: matrix(title).m42,
        wheels: wheels.map(wheel => {
          const rotor = wheel.querySelector('.hero-wheel-rotor');
          const m = matrix(rotor);
          return { angle: Math.atan2(m.b, m.a), radius: wheel.getBoundingClientRect().width / 2 };
        }),
      });
    }
    if ((readyAt !== undefined && now - readyAt > 3600) || now - started > 15000) {
      window.__heroObservation.done = true;
    } else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();"""


def shortest_angle(value):
    return (value + math.pi) % (2 * math.pi) - math.pi


def inspect_motion(samples, animated):
    ready = [sample for sample in samples if sample['ready']]
    assert len(ready) > 5, 'No se observó la imagen del Porsche lista.'
    if animated:
        assert max(sample['x'] for sample in ready) > 100, 'La entrada horizontal no se reprodujo.'
        assert all(b['x'] <= a['x'] + .1 for a, b in zip(ready, ready[1:])), (
            'El auto rebota o avanza en dirección incorrecta.')
        pairs = [(a, b) for a, b in zip(ready, ready[1:]) if 1 < a['x'] - b['x'] < 50]
        assert len(pairs) >= 3, 'Faltan fotogramas de avance para comprobar las ruedas.'
        for a, b in pairs:
            for before, after in zip(a['wheels'], b['wheels']):
                expected = (b['x'] - a['x']) / before['radius']
                actual = shortest_angle(after['angle'] - before['angle'])
                assert abs(shortest_angle(actual - expected)) < .035, (
                    'La rueda desliza o gira a una velocidad diferente del avance.', actual, expected)
        assert any(abs(sample['titleY']) > 3 for sample in samples), 'No se observó la entrada del título.'
    else:
        assert all(abs(sample['x']) < .1 for sample in ready), 'La alternativa estática desplaza el auto.'
        assert all(abs(wheel['angle']) < .01 for sample in ready for wheel in sample['wheels']), (
            'Las ruedas se mueven con movimiento reducido.')

    settled = [sample for sample in ready if sample['t'] > ready[-1]['t'] - 700]
    assert len(settled) >= 3
    assert all(abs(sample['x']) < .1 for sample in settled), 'El auto no termina en reposo.'
    assert all(abs(wheel['angle']) < .01 for sample in settled for wheel in sample['wheels']), (
        'Las ruedas siguen girando después de detenerse.')
    assert abs(ready[-1]['titleY']) < .1, 'El título no termina visible en su posición.'


def check_layout(page, desktop):
    geometry = page.evaluate("""() => {
      const car = document.querySelector('.hero-car').getBoundingClientRect();
      const stage = document.querySelector('.hero-car-stage').getBoundingClientRect();
      const visible = Math.max(0, Math.min(car.right, stage.right) - Math.max(car.left, stage.left));
      return { fraction: visible / car.width, carRight: car.right, stageRight: stage.right,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    }""")
    assert geometry['overflow'] <= 1, ('La página tiene desplazamiento horizontal.', geometry)
    assert geometry['carRight'] > geometry['stageRight'] + 50, 'Se muestra el auto completo.'
    if desktop:
        assert .45 <= geometry['fraction'] <= .65, ('El encuadre no muestra aproximadamente medio auto.', geometry)


def run_case(browser, url, *, mobile=False, reduced=False, screenshots=None):
    context = browser.new_context(
        viewport={'width': 390, 'height': 844} if mobile else {'width': 1440, 'height': 900},
        reduced_motion='reduce' if reduced else 'no-preference', service_workers='block')
    context.add_init_script(OBSERVE)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('window.__heroObservation?.done', timeout=25000)
        samples = page.evaluate('window.__heroObservation.samples')
        inspect_motion(samples, animated=not reduced)
        check_layout(page, desktop=not mobile)
        assert not errors, errors
        if screenshots:
            screenshots.mkdir(parents=True, exist_ok=True)
            name = 'hero-mobile' if mobile else 'hero-reduced' if reduced else 'hero-desktop'
            page.screenshot(path=str(screenshots / f'{name}.jpg'), type='jpeg', quality=92)
        label = 'entrada móvil con giro' if mobile else 'movimiento reducido' if reduced else 'entrada y giro sincronizado'
        print(f'Hero: {label}, encuadre y reposo: OK.')
    finally:
        context.close()


def check_fallback(browser, url, asset):
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, service_workers='block')
    context.route(asset, lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        page.goto(url, wait_until='load')
        page.wait_for_function("""() => {
          const fallback = document.querySelector('.hero-fallback img');
          return fallback?.complete && fallback.naturalWidth > 0;
        }""")
        from playwright.sync_api import expect
        expect(page.locator('.hero-fallback')).to_be_visible()
        expect(page.locator('.hero-car-scene')).to_be_hidden()
        expect(page.locator('.hero-car-stage')).to_have_attribute('data-car-ready', 'false')
        assert not errors, errors
        print(f'Hero: respaldo ante fallo de {asset}: OK.')
    finally:
        context.close()


def verify_hero(browser, url, screenshots=None):
    run_case(browser, url, screenshots=screenshots)
    run_case(browser, url, reduced=True, screenshots=screenshots)
    run_case(browser, url, mobile=True, screenshots=screenshots)
    check_fallback(browser, url, '**/porsche-911*.webp')
    check_fallback(browser, url, '**/porsche-wheel.webp')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url')
    parser.add_argument('--browser', help='Ruta opcional del navegador; por defecto Microsoft Edge.')
    parser.add_argument('--screenshots', type=Path, help='Guardar capturas del estado final para revisión visual.')
    args = parser.parse_args()
    if urlsplit(args.url).hostname not in ('127.0.0.1', 'localhost', '::1'):
        parser.error('Usá una vista local para estas pruebas.')
    from playwright.sync_api import sync_playwright
    with sync_playwright() as driver:
        browser = driver.chromium.launch(
            executable_path=args.browser, channel=None if args.browser else 'msedge',
            headless=True, args=['--no-proxy-server'])
        try:
            verify_hero(browser, args.url, args.screenshots)
        finally:
            browser.close()


if __name__ == '__main__':
    main()
