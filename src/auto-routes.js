import gsap from 'gsap'
import { initCatalog } from './catalog.js'
import { initDetail } from './vehicle-detail.js'
import { brands, vehicles } from './catalog-data.js'

export function mountAutoRoutes({ signal, closeOverlays, contact, reduced, refreshHome }) {
  const home = document.querySelector('#home-content')
  const listing = document.querySelector('#autos-catalogo')
  const detail = document.querySelector('#auto-ficha')
  const views = [home, listing, detail]
  const homeTitle = document.title
  const skip = document.querySelector('.skip-link')
  const navItems = document.querySelectorAll('.navigation a, .menu-primary a')
  let catalog, fiche, current = home, transition
  const catalogHash = brand => brand && brand !== 'all' ? '#autos/' + brand : '#autos'
  function go(hash) {
    if (location.hash !== hash) {
      history.replaceState({ ...history.state, viewScroll: scrollY }, '')
      history.pushState({ fromCatalog: current === listing }, '', hash)
    }
    render()
  }
  function chooseBrand(brand) {
    const hash = catalogHash(brand)
    if (location.hash !== hash) history.pushState({}, '', hash)
  }
  function render({ initial = false, restore = false } = {}) {
    const [, key, slug] = location.hash.split('/')
    const isCatalog = /^#autos(?:\/|$)/.test(location.hash)
    const model = isCatalog && key === 'ficha' ? vehicles.find(item => item.id === slug) : null
    const view = model ? detail : isCatalog ? listing : home
    if (initial && view === home) return
    closeOverlays()
    if (current === detail && view !== detail) fiche?.hide?.()
    transition?.kill()
    for (const element of views) {
      element.hidden = element !== view
      gsap.set(element, { clearProps: 'opacity' })
    }
    let title = homeTitle
    if (view === listing) {
      catalog ??= initCatalog(listing, { navigateBrand: chooseBrand })
      catalog.show(brands.some(brand => brand.id === key) ? key : 'all', current === home && !restore)
      title = 'Autos | CarsMotion'
    } else if (view === detail) {
      fiche ??= initDetail(detail, {
        back: () => history.state?.fromCatalog ? history.back() : go('#autos'),
        contact,
      })
      fiche.show(model)
      title = brands.find(brand => brand.id === model.brand).name + ' ' + model.name + ' | CarsMotion'
    } else {
      refreshHome()
    }
    document.title = title
    navItems.forEach(link => {
      const active = view === home ? link.hash === '#inicio' : link.hash === '#autos'
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
    skip.href = view === home ? '#seleccion' : '#' + view.id
    skip.textContent = view === home ? 'Saltar a la selección' : 'Saltar al contenido'
    if (view !== current && !initial && !reduced()) {
      transition = gsap.fromTo(view, { opacity: .45 }, { opacity: 1, duration: .24, ease: 'power2.out', clearProps: 'opacity' })
    }
    current = view
    if (!initial) {
      const focusTarget = view.querySelector('h1[tabindex="-1"]') || view
      focusTarget.focus({ preventScroll: true })
    }
    window.scrollTo({ top: restore ? history.state?.viewScroll || 0 : 0, behavior: 'instant' })
  }
  // Keep native links for copying URLs, opening new tabs and keyboard activation.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest('a[href^="#"]')
    if (!link) return
    if (link === skip && current !== home) {
      event.preventDefault()
      current.focus()
      return
    }
    if (link.matches('.footer-up') && current !== home) {
      event.preventDefault()
      current.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: reduced() ? 'instant' : 'smooth' })
      return
    }
    if (link.hash.startsWith('#autos') || (link.hash === '#inicio' && current !== home)) {
      event.preventDefault()
      go(link.hash)
    }
  }, { signal })
  window.addEventListener('hashchange', () => {
    if (current !== home || location.hash.startsWith('#autos')) render({ restore: true })
  }, { signal })
  signal.addEventListener('abort', () => {
    transition?.kill()
    catalog?.destroy()
    fiche?.destroy()
  }, { once: true })
  render({ initial: true })
}
