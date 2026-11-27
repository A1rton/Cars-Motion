import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { brands, imageUrl, vehicles } from './catalog-data.js'
import { catalogIcon as icon } from './catalog-icons.js'
import { isFavorite, toggleFavorite } from './favorites.js'
import './catalog.css'

const brandName = new Map(brands.map(brand => [brand.id, brand.name]))
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const collator = new Intl.Collator('es-AR', { numeric: true, sensitivity: 'base' })
const fullName = vehicle => `${brandName.get(vehicle.brand)} ${vehicle.name}`

function el(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  if (text) node.textContent = text
  return node
}

function buildCard(vehicle) {
  const photo = vehicle.images[0]
  const card = el('article', 'catalog-card')
  card.dataset.id = vehicle.id
  const link = el('a', 'cm-card-link')
  link.href = '#autos/ficha/' + vehicle.id
  link.setAttribute('aria-label', 'Ver ficha de ' + fullName(vehicle))
  const frame = el('div', 'cm-card-frame')
  const img = el('img', 'cm-photo')
  img.src = photo.small
  img.srcset = `${photo.small} 800w, ${photo.src} 1600w`
  img.sizes = '(min-width: 1050px) 30vw, (min-width: 650px) 45vw, 95vw'
  img.alt = photo.alt
  img.loading = 'lazy'
  img.decoding = 'async'
  img.style.objectPosition = photo.position || '50% 50%'
  frame.append(img)
  const info = el('div', 'cm-card-info')
  info.append(el('p', 'cm-maker', brandName.get(vehicle.brand)), el('h3','cm-model',vehicle.name))
  const year = vehicle.year
  info.append(el('p', 'cm-category', year ? `${vehicle.category} · ${year}` : vehicle.category))
  const arrow = el('span', 'cm-card-arrow')
  arrow.innerHTML = icon('arrow-up-right')
  info.append(arrow)
  link.append(frame, info)
  const save = el('button','cm-save')
  save.type = 'button'
  save.innerHTML = icon('heart')
  save.setAttribute('aria-label', 'Guardar ' + fullName(vehicle) + ' en favoritos')
  save.setAttribute('aria-pressed', String(isFavorite(vehicle.id)))
  save.onclick = () => toggleFavorite(vehicle.id)
  card.append(link, save)
  return card
}

export function initCatalog(container, {navigateBrand}) {
  const state = { brand: 'all', onlySaved: false }
  container.innerHTML = `
    <header class="cm-hero">
      <picture><source media="(max-width:600px)" srcset="${imageUrl('porsche-sunset-800.webp')}"><img alt="" src="${imageUrl('porsche-sunset-1600.webp')}"></picture>
      <div class="cm-hero-content"><nav aria-label="Ruta de navegación"><a href="#inicio">Inicio</a><span aria-hidden="true">/</span>Autos</nav>
        <h1 class="cm-title" tabindex="-1">Autos</h1></div>
      <span class="cm-hero-caption">Porsche 911</span>
    </header>
    <div class="cm-content">
      <div class="cm-brands" role="group" aria-label="Filtrar por marca"></div>
      <div class="cm-toolbar" role="search" aria-label="Buscar y filtrar autos">
        <label class="cm-search">${icon('search')}<span class="sr-only">Buscar marca o modelo</span><input type="search" placeholder="Buscar marca o modelo" autocomplete="off"></label>
        <label class="cm-select-label"><span>Carrocería</span><span class="cm-select-wrap"><select id="catalog-body"><option value="all">Todas</option></select>${icon('chevron-down')}</span></label>
        <label class="cm-select-label"><span>Ordenar por</span><span class="cm-select-wrap"><select id="catalog-order"><option value="featured">Destacados</option><option value="asc">Marca A–Z</option><option value="desc">Marca Z–A</option></select>${icon('chevron-down')}</span></label>
        <button type="button" class="cm-saved-filter" aria-pressed="false">${icon('heart')} Favoritos <span></span></button>
      </div>
      <div class="cm-result-head"><h2>Modelos</h2><div class="cm-result-tools"><button type="button" class="cm-clear" hidden>Limpiar filtros</button><span class="cm-count" role="status"></span></div></div>
      <div class="cm-grid"></div>
      <div class="catalog-empty" hidden><h3></h3><p></p><button type="button" data-catalog-reset>Ver todos los modelos ${icon('arrow-right')}</button></div>
    </div>`
  const find = s => container.querySelector(s)
  const grid = find('.cm-grid')
  const empty = find('.catalog-empty')
  const search = find('input')
  const body = find('#catalog-body')
  const order = find('#catalog-order')
  const onlySaved = find('.cm-saved-filter')
  const bar = find('.cm-brands')
  const cards = new Map(vehicles.map(v => [v.id,buildCard(v)]))
  const categories = [...new Set(vehicles.map(v => v.category))].sort(collator.compare)
  for (const category of categories) body.add(new Option(category,category))
  for (const brand of [{id:'all',name:'Todas',logo:null}, ...brands]) {
    const btn = el('button','cm-brand')
    btn.type = 'button'
    btn.dataset.brand = brand.id
    btn.title = brand.name
    btn.setAttribute('aria-label', brand.id === 'all' ? 'Todas las marcas' : brand.name)
    if (brand.logo) {
      const img = el('img', '')
      img.alt = ''
      img.src = brand.logo
      btn.append(img)
    } else btn.textContent = brand.name
    btn.onclick = () => {
      if (state.brand === brand.id) return
      state.brand = brand.id
      render(true)
      navigateBrand(brand.id)
    }
    bar.append(btn)
  }

  let animation
  function render(animate = false) {
    const tokens = normalize(search.value).split(/\s+/).filter(Boolean)
    const selected = vehicles.filter(v => {
      const haystack = normalize(fullName(v) + ' ' + v.category)
      return (state.brand === 'all' || state.brand === v.brand) &&
        (body.value === 'all' || body.value === v.category) &&
        (!state.onlySaved || isFavorite(v.id)) && tokens.every(token => haystack.includes(token))
    })
    if (order.value !== 'featured') selected.sort((a,b) => collator.compare(fullName(a),fullName(b)) * (order.value === 'asc' ? 1 : -1))
    for (const btn of bar.children) btn.setAttribute('aria-pressed', String(btn.dataset.brand === state.brand))
    onlySaved.setAttribute('aria-pressed', String(state.onlySaved))
    onlySaved.querySelector('span').textContent = vehicles.filter(v => isFavorite(v.id)).length
    const active = document.activeElement
    animation?.progress(1).kill()
    const canMove = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-paused') && !container.hidden
    const survivors = selected.map(v => cards.get(v.id)).filter(node => grid.contains(node))
    const before = canMove && survivors.length ? Flip.getState(survivors) : null
    for (const v of selected) cards.get(v.id).querySelector('.cm-save').setAttribute('aria-pressed', String(isFavorite(v.id)))
    grid.replaceChildren(...selected.map(v => cards.get(v.id)))
    if (before) animation = Flip.from(before, {targets:survivors,duration:.32,ease:'power2.out'})
    if (active?.matches('.cm-save')) {
      if (grid.contains(active)) active.focus({preventScroll:true})
      else onlySaved.focus({preventScroll:true})
    }
    find('.cm-count').textContent = selected.length === 1 ? '1 modelo' : selected.length + ' modelos'
    find('.cm-clear').hidden = !selected.length || !(tokens.length || body.value !== 'all' || state.onlySaved || state.brand !== 'all')
    empty.hidden = selected.length > 0
    if (!selected.length) {
      const noFavorites = state.onlySaved && !vehicles.some(v => isFavorite(v.id))
      empty.querySelector('h3').textContent = noFavorites ? 'Todavía no guardaste modelos.' : 'Sin modelos para esta selección.'
      empty.querySelector('p').textContent = noFavorites ? 'Usá el corazón de cada modelo para guardarlo acá.' : 'Probá con otra marca o ajustá los filtros.'
    }
  }
  onlySaved.onclick = () => {state.onlySaved = !state.onlySaved; render(true)}
  search.oninput = () => render()
  body.onchange = order.onchange = () => render(true)
  function clearFilters() {
    search.value = ''
    body.value = 'all'
    order.value = 'featured'
    state.onlySaved = false
    state.brand = 'all'
  }
  function reset() {
    clearFilters()
    render(true)
    navigateBrand('all')
    bar.scrollLeft = 0
    search.focus({preventScroll:true})
  }
  find('.cm-clear').onclick = find('[data-catalog-reset]').onclick = reset
  const syncFavorites = () => { if (!container.hidden) render() }
  window.addEventListener('carsmotion:favorites', syncFavorites)
  return {
    show(brand, fresh) {
      if (fresh) clearFilters()
      state.brand = brandName.has(brand) ? brand : 'all'
      render()
      const active = bar.querySelector('[aria-pressed="true"]')
      if (active && bar.scrollWidth > bar.clientWidth) {
        bar.scrollLeft += active.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - active.clientWidth) / 2
      }
    },
    destroy() {
      window.removeEventListener('carsmotion:favorites', syncFavorites)
      animation?.kill()
      container.replaceChildren()
    }
  }
}
