import { prepareButtonMotion } from './button-motion.js'
import { fields, ranges, conditionNames, known, validPrice, matchesFilters, labelFor, normalize, collator } from './catalog-filters.js'
import { Flip } from 'gsap/Flip'
import { brands, imageUrl, vehicles } from './catalog-data.js'
import { catalogIcon as icon } from './catalog-icons.js'
import './catalog.css'

const brandName = new Map(brands.map(brand => [brand.id, brand.name]))
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
  img.sizes = '(min-width: 1450px) 22vw, (min-width: 901px) 32vw, (min-width: 620px) 45vw, 95vw'
  img.alt = photo.alt
  img.loading = 'lazy'
  img.decoding = 'async'
  img.style.objectPosition = photo.position || '50% 50%'
  frame.append(img)
  const info = el('div', 'cm-card-info')
  info.append(el('p', 'cm-maker', brandName.get(vehicle.brand)), el('h3','cm-model',vehicle.name))
  info.append(el('p', 'cm-version', vehicle.condition ? vehicle.version : 'Versión sugerida · ' + vehicle.version))
  const gearbox = vehicle.transmission || 'Transmisión a confirmar'
  info.append(el('p', 'cm-category', [gearbox, vehicle.doors && vehicle.doors + ' puertas'].filter(Boolean).join(' · ')))
  link.append(frame, info)
  card.append(link)
  return card
}


export function initCatalog(container, { navigateBrand }) {
  const filters = {}
  let animation
  const smallViewport = matchMedia('(max-width: 900px)')
  container.innerHTML = `
    <header class="cm-hero">
      <picture><source media="(max-width:600px)" srcset="${imageUrl('porsche-sunset-800.webp')}"><img alt="" src="${imageUrl('porsche-sunset-1600.webp')}"></picture>
      <div class="cm-hero-content">
        <div><h1 class="cm-title" tabindex="-1">Catálogo de autos</h1></div>
      </div>
    </header>
    <div class="cm-content"><div class="cm-layout">
      <section class="cm-results" aria-labelledby="cm-models">
        <header class="cm-result-head"><div><h2 id="cm-models">Modelos</h2><span class="cm-count" role="status"></span></div>
          <label class="cm-order"><span>Ordenar por</span><select id="catalog-order"><option value="featured">Destacados</option><option value="asc">Marca A–Z</option><option value="desc">Marca Z–A</option></select></label>
        </header>
        <div class="cm-search-row">
          <label class="cm-search">${icon('search')}<span class="sr-only">Buscar marca o modelo</span><input type="search" placeholder="Buscar marca o modelo" autocomplete="off"></label>
          <button type="button" class="cm-open-filters cm-filter-open pill-button button-dark" aria-haspopup="dialog" aria-controls="cm-dialog">${icon('sliders-horizontal')} Filtrar <span data-filter-count>0</span></button>
        </div>
        <div class="cm-active cm-chips" role="group" aria-label="Filtros activos" hidden><button type="button" class="cm-clear text-link">Limpiar filtros</button></div>
        <div class="cm-grid"></div>
        <div class="catalog-empty" hidden><h3></h3><p></p><button class="pill-button button-dark" type="button" data-catalog-reset>Ver todos los modelos ${icon('arrow-right')}</button></div>
      </section>
      <aside class="cm-sidebar" aria-label="Filtrar catálogo"><div class="cm-filter-panel">
        <div class="cm-panel-head"><h2 id="cm-filter-title">Filtros</h2>
          <button type="button" data-motion-icon class="cm-close-filters button-light" aria-label="Cerrar filtros">${icon('x')}</button></div>
        <div class="cm-filter-groups"></div>
        <button type="button" class="cm-filter-done pill-button button-dark">Ver resultados <span data-mobile-results></span> ${icon('arrow-right')}</button>
      </div></aside>
    </div></div>
    <dialog id="cm-dialog" class="cm-filter-dialog" aria-labelledby="cm-filter-title"></dialog>`

  const find = selector => container.querySelector(selector)
  const cards = new Map(vehicles.map(vehicle => {
    const card = buildCard(vehicle)
    prepareButtonMotion(card)
    return [vehicle.id, card]
  }))
  const grid = find('.cm-grid')
  const search = find('input[type=search]')
  const order = find('#catalog-order')
  const active = find('.cm-active')
  const clear = find('.cm-clear')
  const dialog = find('.cm-filter-dialog')
  const panel = find('.cm-filter-panel')
  const controls = new Map()

  function group(title, expanded = false) {
    const group = el('details', 'cm-filter-group cm-group')
    group.open = expanded
    const summary = el('summary', '', title)
    summary.insertAdjacentHTML('beforeend', icon('chevron-down'))
    const content = el('div', 'cm-fields')
    group.append(summary, content)
    find('.cm-filter-groups').append(group)
    return content
  }

  function choices(parent, key, options) {
    const buttons = el('div', key === 'brand' ? 'cm-brands' : 'cm-conditions')
    buttons.setAttribute('role', 'group')
    buttons.setAttribute('aria-label', fields[key])
    for (const {id, name, logo} of options) {
      const button = el('button', key === 'brand' ? 'cm-brand' : 'cm-choice')
      button.type = 'button'
      button.dataset[key] = id
      button.setAttribute('aria-label', name)
      if (logo) {
        const img = el('img', '')
        img.alt = ''
        img.src = logo
        button.title = name
        button.append(img)
      } else {
        button.textContent = name
        button.dataset.motionPlain = ''
      }
      button.onclick = () => change(key, id === 'all' ? '' : id)
      buttons.append(button)
    }
    parent.append(buttons)
  }

  function addSelect(parent, key) {
    const field = el('label', 'cm-field')
    const select = el('select', '')
    select.id = key === 'category' ? 'catalog-body' : 'catalog-' + key
    select.onchange = () => change(key, select.value)
    field.append(el('span', '', fields[key]), select)
    parent.append(field)
    controls.set(key, select)
  }

  function addRange(parent, minKey, maxKey) {
    const pair = el('div', 'cm-range')
    for (const key of [minKey, maxKey]) {
      const field = el('label', 'cm-field')
      const input = el('input', '')
      input.type = 'number'
      input.min = '0'
      input.step = ranges[key] !== 'price' ? '1' : 'any'
      input.inputMode = ranges[key] !== 'price' ? 'numeric' : 'decimal'
      input.placeholder = 'Sin límite'
      input.oninput = () => {
        if (!input.validity.valid) { input.reportValidity(); return }
        change(key, input.value)
      }
      field.append(el('span', '', fields[key]), input)
      pair.append(field)
      controls.set(key, input)
    }
    parent.append(pair)
  }

  const condition = group('Condición', true)
  choices(condition, 'condition', [{id:'all',name:'Todos'}, {id:'new',name:'0 km'}, {id:'used',name:'Usados'}])
  if (!vehicles.some(vehicle => conditionNames[vehicle.condition])) {
    condition.append(el('p', 'cm-filter-note', 'Los modelos de referencia todavía no tienen condición publicada.'))
  }
  const models = group('Marca y modelo', true)
  choices(models, 'brand', [{id:'all',name:'Todas'}, ...brands])
  for (const key of ['name', 'category', 'version']) addSelect(models, key)
  const amounts = group('Precio, año y kilómetros')
  const currencies = [...new Set(vehicles.filter(validPrice).map(v => v.currency))]
  let priceCurrency = currencies.includes('ARS') ? 'ARS' : currencies[0] || 'ARS'
  if (currencies.length > 1) {
    const label = el('label', 'cm-field', 'Moneda del precio')
    const unit = el('select', '')
    for (const code of currencies) unit.add(new Option(code, code))
    unit.value = priceCurrency
    unit.onchange = () => { priceCurrency = unit.value; render() }
    label.append(unit)
    amounts.append(label)
  }
  addRange(amounts, 'priceMin', 'priceMax')
  addRange(amounts, 'yearMin', 'yearMax')
  addRange(amounts, 'mileageMin', 'mileageMax')
  const specs = group('Características técnicas')
  for (const key of ['fuel','tractionControl','doors','transmission','steering']) addSelect(specs, key)

  function updateControls() {
    const withinBrand = filters.brand ? vehicles.filter(v => v.brand === filters.brand) : vehicles
    for (const [key, control] of controls) {
      if (ranges[key]) {
        control.placeholder = ranges[key] === 'price' ? priceCurrency : 'Sin límite'
        if (control.value !== (filters[key] || '')) control.value = filters[key] || ''
        continue
      }
      let source = vehicles
      if (key === 'name') source = withinBrand
      if (key === 'version') source = withinBrand.filter(v => !filters.name || v.name === filters.name)
      const values = [...new Set(source.map(v => v[key]).filter(known).map(String))].sort(collator.compare)
      const signature = JSON.stringify(values)
      if (control.dataset.options !== signature) {
        control.replaceChildren(new Option(values.length ? 'Todos' : 'Sin datos publicados',''))
        for (const value of values) control.add(new Option(labelFor(key, value, brandName), value))
        control.dataset.options = signature
      }
      control.disabled = !values.length
      control.value = filters[key] || ''
    }
    for (const button of panel.querySelectorAll('[data-brand], [data-condition]')) {
      const key = button.hasAttribute('data-brand') ? 'brand' : 'condition'
      button.setAttribute('aria-pressed', String(button.dataset[key] === (filters[key] || 'all')))
    }
  }

  function setBrand(value) {
    if ((filters.brand || '') !== value) {
      delete filters.name
      delete filters.version
    }
    if (value) filters.brand = value
    else delete filters.brand
  }

  function change(key, value) {
    if (key === 'brand') { setBrand(value); navigateBrand(value || 'all') }
    else if (value) filters[key] = value
    else delete filters[key]
    if (key === 'name') delete filters.version
    render(!ranges[key])
  }

  function chips() {
    active.querySelectorAll('.cm-chip').forEach(chip => chip.remove())
    const entries = Object.entries(filters).map(([key, value]) => [key, fields[key] + ' · ' + labelFor(key, value, brandName) + (ranges[key] === 'price' ? ' ' + priceCurrency : '')])
    if (search.value.trim()) entries.push(['search', search.value.trim()])
    for (const [key, label] of entries) {
      const chip = el('button', 'cm-chip', label)
      chip.type = 'button'
      chip.setAttribute('aria-label', 'Quitar filtro ' + label)
      chip.insertAdjacentHTML('beforeend', icon('x'))
      chip.onclick = () => {
        if (key === 'search') search.value = ''
        else change(key, '')
        if (key === 'search') render(true)
        const nextFocus = active.querySelector('.cm-chip') || search
        nextFocus.focus({preventScroll:true})
      }
      active.insertBefore(chip, clear)
    }
    active.hidden = !entries.length
    find('[data-filter-count]').textContent = entries.length
  }

  function render(animate = false) {
    updateControls()
    chips()
    const tokens = normalize(search.value).split(/\s+/).filter(Boolean)
    const selected = vehicles.filter(v => matchesFilters(v, filters, priceCurrency) &&
      tokens.every(token => normalize(fullName(v) + ' ' + v.category + ' ' + (v.version || '')).includes(token)))
    if (order.value !== 'featured') {
      const direction = order.value === 'asc' ? 1 : -1
      selected.sort((a,b) => direction * collator.compare(fullName(a), fullName(b)))
    }
    animation?.progress(1).kill()
    const canMove = animate && !container.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !document.documentElement.classList.contains('motion-paused')
    const survivors = selected.map(v => cards.get(v.id)).filter(card => grid.contains(card))
    const before = canMove && survivors.length ? Flip.getState(survivors) : null
    grid.replaceChildren(...selected.map(v => cards.get(v.id)))
    if (before) animation = Flip.from(before, { targets:survivors, duration:.5, ease:'power2.inOut' })
    find('.cm-count').textContent = selected.length === 1 ? '1 modelo' : selected.length + ' modelos'
    find('[data-mobile-results]').textContent = '(' + selected.length + ')'
    const empty = find('.catalog-empty')
    empty.hidden = selected.length > 0
    if (!selected.length) {
      empty.querySelector('h3').textContent = 'Sin resultados para esta selección.'
      empty.querySelector('p').textContent = 'Quitá un filtro o probá con otra búsqueda.'
    }
  }

  function clearAll() {
    Object.keys(filters).forEach(key => delete filters[key])
    search.value = ''
    order.value = 'featured'
  }
  function reset() {
    clearAll()
    navigateBrand('all')
    render(true)
    search.focus({preventScroll:true})
  }

  function mountPanel() {
    if (!smallViewport.matches && dialog.open) dialog.close()
    const host = smallViewport.matches ? dialog : find('.cm-sidebar')
    if (panel.parentElement !== host) host.append(panel)
  }
  mountPanel()
  smallViewport.addEventListener('change', mountPanel)
  find('.cm-open-filters').onclick = () => dialog.showModal()
  find('.cm-close-filters').onclick = find('.cm-filter-done').onclick = () => dialog.close()
  dialog.onclick = event => { if (event.target === dialog) dialog.close() }
  search.oninput = () => render()
  order.onchange = () => render(true)
  clear.onclick = find('[data-catalog-reset]').onclick = reset
  prepareButtonMotion(container)
  return {
    show(brand, fresh) {
      if (fresh) clearAll()
      setBrand(brandName.has(brand) ? brand : '')
      render()
    },
    destroy() {
      smallViewport.removeEventListener('change', mountPanel)
      if (dialog.open) dialog.close()
      animation?.kill()
      container.replaceChildren()
    }
  }
}
