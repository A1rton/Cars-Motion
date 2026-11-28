import Swiper from 'swiper'
import 'swiper/css'
import { brands } from './catalog-data.js'
import { catalogIcon as icon } from './catalog-icons.js'
import { isFavorite, toggleFavorite } from './favorites.js'
import { prepareButtonMotion } from './button-motion.js'
import './vehicle-detail.css'

function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  if (text) node.textContent = text
  return node
}

function setCredit(node, image) {
  node.replaceChildren()
  node.hidden = !image.credit
  if (!image.credit) return
  const source = element('a', '', image.credit)
  source.href = image.source
  const license = element('a', '', 'CC BY-SA 4.0')
  license.href = image.licenseUrl
  for (const link of [source, license]) {
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
  }
  node.append('Fotografía de ', source, ' · ', license)
}

function reduced() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('motion-paused')
}

const numbers = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

function display(value) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'number' && Number.isFinite(value)) return numbers.format(value)
  return typeof value === 'string' ? value.trim() : ''
}

function withUnit(value, unit) {
  return Number.isFinite(value) && value >= 0 ? numbers.format(value) + ' ' + unit : ''
}

function factList(fields) {
  const list = element('dl', 'vd-facts')
  for (const [label, value] of fields) {
    const formatted = display(value)
    if (!formatted) continue
    const row = element('div', 'vd-fact')
    row.append(element('dt', '', label), element('dd', '', formatted))
    list.append(row)
  }
  return list
}

// Destinations come from a verified listing. A URL is optional even when the
// vehicle has a published price or financing terms.
function destination(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

function renderSpecifications(section, vehicle) {
  section.replaceChildren()
  const groups = []
  if (vehicle.condition === 'used') {
    groups.push(['Estado e historial', [
      ['Año', vehicle.year?.toString()], ['Kilometraje', withUnit(vehicle.mileage, 'km')],
      ['Estado de la unidad', vehicle.unitState], ['Mantenimiento', vehicle.maintenance],
      ['Services registrados', vehicle.serviceRecords], ['Único dueño', vehicle.singleOwner],
      ['Garantía', vehicle.warranty],
    ]])
  }
  groups.push(['Especificaciones', [
    ['Carrocería', vehicle.category], [vehicle.condition ? 'Color' : 'Color de la imagen', vehicle.color], ['Combustible', vehicle.fuel],
    ['Motor', vehicle.engine], ['Potencia', withUnit(vehicle.power, 'CV')],
    ['Transmisión', vehicle.transmission], ['Tracción', vehicle.drive],
    ['Puertas', vehicle.doors], ['Plazas', vehicle.seats],
  ]])
  // Extended groups are optional arrays of documented { label, value } pairs.
  for (const [title, key] of [
    ['Rendimiento', 'performance'], ['Equipamiento exterior', 'exterior'],
    ['Equipamiento interior', 'interior'], ['Seguridad', 'safety'],
    ['Tecnología', 'technology'], ['Dimensiones', 'dimensions'],
  ]) {
    if (Array.isArray(vehicle[key])) groups.push([title, vehicle[key].map(fact => [fact.label, fact.value])])
  }
  groups.push(['Información comercial', [
    ['Disponibilidad', vehicle.availability], ['Sucursal', vehicle.location],
    ['Financiación', vehicle.financing], ['Entrega inmediata', vehicle.immediate],
  ]])
  for (const [title, fields] of groups) {
    const list = factList(fields)
    if (!list.childElementCount) continue
    const block = element('section', 'vd-spec-group')
    block.append(element('h2', '', title), list)
    section.append(block)
  }
}

export function initDetail(container, { back, contact }) {
  container.innerHTML = `
    <div class="vd-shell">
      <div class="vd-nav">
        <a class="vd-back" href="#autos">${icon('arrow-left')}<span class="motion-underline">Volver a Autos</span></a>
        <button type="button" class="vd-save" aria-pressed="false">${icon('heart')}<span class="motion-underline">Guardar</span></button>
      </div>
      <div class="vd-layout">
        <h1 class="vd-heading" tabindex="-1"><span class="vd-maker"></span><span class="vd-name"></span><span class="vd-version"></span></h1>
        <section class="vd-gallery" aria-label="Fotografías del modelo" aria-roledescription="carrusel">
          <div class="vd-frame">
            <div class="swiper vd-slider" tabindex="0" aria-label="Galería del modelo">
              <div class="swiper-wrapper"></div>
            </div>
            <button type="button" class="vd-expand vd-icon" data-motion-round aria-label="Ampliar fotografía">${icon('expand')}</button>
          </div>
          <div class="vd-strip">
            <div class="vd-thumbs" aria-label="Seleccionar fotografía" role="group"></div>
            <div class="vd-page-controls">
              <button class="vd-icon vd-prev" type="button" aria-label="Fotografía anterior">${icon('chevron-left')}</button>
              <span class="vd-counter" aria-live="polite" aria-atomic="true"></span>
              <button class="vd-icon vd-next" type="button" aria-label="Fotografía siguiente">${icon('chevron-right')}</button>
            </div>
          </div>
          <small class="vd-credit"></small>
        </section>
        <div class="vd-info">
          <p class="vd-condition"></p>
          <p class="vd-price"></p>
          <p class="vd-description"></p>
          <div class="vd-actions"></div>
        </div>
      </div>
      <div class="vd-specs"></div>
    </div>
    <dialog class="vd-lightbox" aria-labelledby="vd-view-title">
      <div class="vd-light-inner">
        <div class="vd-light-bar"><h2 id="vd-view-title"></h2>
          <button class="vd-icon vd-close" type="button" aria-label="Cerrar fotografía">${icon('x')}</button>
        </div>
        <img class="vd-light-photo" alt=""/>
        <div class="vd-light-bottom">
          <small class="vd-light-credit"></small>
          <div class="vd-light-controls">
            <button type="button" class="vd-icon vd-light-prev" aria-label="Fotografía anterior">${icon('chevron-left')}</button>
            <span class="vd-light-counter" aria-live="polite"></span>
            <button type="button" class="vd-icon vd-light-next" aria-label="Fotografía siguiente">${icon('chevron-right')}</button>
          </div>
        </div>
      </div>
    </dialog>`

  const find = (selector) => container.querySelector(selector)
  const dialog = find('.vd-lightbox')
  const slides = find('.swiper-wrapper')
  const thumbs = find('.vd-thumbs')
  const expand = find('.vd-expand')
  const save = find('.vd-save')
  let model
  let slider

  function syncFavorite() {
    if (!model) return
    const saved = isFavorite(model.id)
    save.setAttribute('aria-pressed', String(saved))
    save.querySelector('span').textContent = saved ? 'Guardado' : 'Guardar'
    save.setAttribute('aria-label', saved ? 'Quitar de favoritos' : 'Guardar en favoritos')
  }

  function syncPhoto(index) {
    const image = model.images[index]
    const label = `${index + 1} / ${model.images.length}`
    find('.vd-counter').textContent = label
    Array.from(thumbs.children).forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)))
    setCredit(find('.vd-credit'), image)
    if (dialog.open) {
      find('.vd-light-photo').src = image.src
      find('.vd-light-photo').alt = image.alt
      find('.vd-light-counter').textContent = label
      setCredit(find('.vd-light-credit'), image)
    }
  }

  function go(index) {
    if (!slider) return
    const count = model.images.length
    slider.slideTo((index + count) % count, reduced() ? 0 : 320)
  }

  thumbs.addEventListener('click', event => {
    const thumb = event.target.closest('button')
    if (thumb) go(Number(thumb.dataset.index))
  })
  for (const selector of ['.vd-prev', '.vd-light-prev']) find(selector).onclick = () => go(slider.activeIndex - 1)
  for (const selector of ['.vd-next', '.vd-light-next']) find(selector).onclick = () => go(slider.activeIndex + 1)
  for (const target of [find('.vd-gallery'), dialog]) target.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    go(slider.activeIndex + (event.key === 'ArrowRight' ? 1 : -1))
  })
  expand.onclick = () => {
    dialog.showModal()
    syncPhoto(slider.activeIndex)
    find('.vd-close').focus({ preventScroll: true })
  }
  find('.vd-close').onclick = () => dialog.close()
  save.onclick = () => { toggleFavorite(model.id); syncFavorite() }
  window.addEventListener('carsmotion:favorites', syncFavorite)
  find('.vd-back').onclick = event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    back()
  }

  function hide() {
    if (dialog.open) dialog.close()
    slider?.destroy(true, true)
    slider = undefined
    model = undefined
  }

  function show(vehicle) {
    hide()
    model = vehicle
    const maker = brands.find(brand => brand.id === model.brand).name
    find('.vd-maker').textContent = maker
    find('.vd-name').textContent = model.name
    find('#vd-view-title').textContent = maker + ' ' + model.name
    const isNew = model.condition === 'new'
    const isUsed = model.condition === 'used'
    const isListing = isNew || isUsed
    find('.vd-version').textContent = model.version || ''
    find('.vd-version').hidden = !model.version
    find('.vd-condition').textContent = isNew ? 'Nuevo · 0 km' : isUsed ? 'Vehículo usado' : 'Modelo de referencia'
    const price = find('.vd-price')
    price.hidden = !(isListing && Number.isFinite(model.price) && model.price >= 0 && ['ARS','USD'].includes(model.currency))
    if (!price.hidden) price.textContent = (isNew ? 'Precio base · ' : '') + model.currency + ' ' + numbers.format(model.price)
    const description = find('.vd-description')
    description.textContent = model.description || (isListing ? '' : 'La imagen presenta el modelo. Consultá por unidades, precios y disponibilidad.')
    description.hidden = !description.textContent
    const actions = find('.vd-actions')
    actions.replaceChildren()
    function addAction(label, url) {
      const href = destination(url)
      if (!href) return false
      const link = element('a', actions.childElementCount ? 'vd-secondary text-link' : 'pill-button button-dark', label)
      link.href = href
      link.insertAdjacentHTML('beforeend', icon('arrow-up-right'))
      actions.append(link)
      return true
    }
    if (isNew) addAction('Configurar vehículo', model.configuratorUrl)
    if (!addAction('Consultar vehículo', model.actions?.consult)) {
      const inquiry = element('button', actions.childElementCount ? 'vd-secondary text-link' : 'vd-contact pill-button button-dark', 'Consultar por este modelo')
      inquiry.type = 'button'
      inquiry.insertAdjacentHTML('beforeend', icon('arrow-right'))
      inquiry.onclick = () => contact(inquiry, model)
      actions.append(inquiry)
    }
    if (isUsed) {
      addAction('Reservar', model.actions?.reserve)
      if (model.financing === true) addAction('Solicitar financiación', model.actions?.finance)
      addAction('Agendar una visita', model.actions?.visit)
    }
    renderSpecifications(find('.vd-specs'), model)
    prepareButtonMotion(container)
    syncFavorite()
    slides.replaceChildren()
    thumbs.replaceChildren()
    const hasImages = Boolean(model.images?.length)
    find('.vd-gallery').hidden = !hasImages
    find('.vd-layout').classList.toggle('vd-text-only', !hasImages)
    if (!hasImages) return
    const multiple = model.images.length > 1
    find('.vd-strip').hidden = !multiple
    find('.vd-light-controls').hidden = !multiple
    find('.vd-slider').tabIndex = multiple ? 0 : -1
    model.images.forEach((image, index) => {
      const photo = element('img', 'vd-photo')
      photo.src = image.src
      photo.alt = image.alt
      photo.decoding = 'async'
      if (image.width && image.height) { photo.width = image.width; photo.height = image.height }
      const slide = element('div', 'swiper-slide')
      slide.setAttribute('role', 'group')
      slide.setAttribute('aria-label', `Fotografía ${index + 1} de ${model.images.length}`)
      slide.append(photo)
      slides.append(slide)
      if (!multiple) return
      const thumb = element('button', 'vd-thumb')
      thumb.type = 'button'
      thumb.dataset.index = index
      thumb.setAttribute('aria-label', 'Mostrar fotografía ' + (index + 1))
      const preview = element('img', '')
      preview.alt = ''
      preview.src = image.small || image.src
      preview.style.objectPosition = image.position || 'center'
      thumb.append(preview)
      thumbs.append(thumb)
    })
    slider = new Swiper(find('.vd-slider'), {
      slidesPerView: 1, speed: reduced() ? 0 : 320, grabCursor: multiple,
      allowTouchMove: multiple, watchOverflow: true,
      on: {
        touchStart(swiper) { swiper.params.speed = reduced() ? 0 : 320 },
        slideChange(swiper) { syncPhoto(swiper.activeIndex) },
      },
    })
    syncPhoto(0)
  }
  function destroy() {
    hide()
    window.removeEventListener('carsmotion:favorites', syncFavorite)
    container.replaceChildren()
  }
  return { show, hide, destroy }
}
