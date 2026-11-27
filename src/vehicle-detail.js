import Swiper from 'swiper'
import 'swiper/css'
import { brands } from './catalog-data.js'
import { catalogIcon as icon } from './catalog-icons.js'
import { isFavorite, toggleFavorite } from './favorites.js'
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

export function initDetail(container, { back, contact }) {
  container.innerHTML = `
    <div class="vd-shell">
      <div class="vd-nav">
        <a class="vd-back" href="#autos">${icon('arrow-left')}<span class="motion-underline">Volver a Autos</span></a>
        <button type="button" class="vd-save" aria-pressed="false">${icon('heart')}<span>Guardar</span></button>
      </div>
      <div class="vd-layout">
        <h1 class="vd-heading" tabindex="-1"><span class="vd-maker"></span><span class="vd-name"></span></h1>
        <section class="vd-gallery" aria-label="Fotografías del modelo" aria-roledescription="carrusel">
          <div class="vd-frame">
            <div class="swiper vd-slider" tabindex="0" aria-label="Galería del modelo">
              <div class="swiper-wrapper"></div>
            </div>
            <button type="button" class="vd-expand vd-icon" aria-label="Ampliar fotografía">${icon('expand')}</button>
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
          <p class="vd-description"></p>
          <dl class="vd-facts"></dl>
          <button type="button" class="vd-contact pill-button button-dark">Consultar por este modelo ${icon('arrow-up-right')}</button>
        </div>
      </div>
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
  find('.vd-contact').onclick = event => contact(event.currentTarget, model)
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
    find('.vd-description').textContent = model.description
    find('.vd-facts').replaceChildren(...model.facts.map(fact => {
      const row = element('div', 'vd-fact')
      row.append(element('dt', '', fact.label), element('dd', '', fact.value))
      return row
    }))
    syncFavorite()
    slides.replaceChildren()
    thumbs.replaceChildren()
    const multiple = model.images.length > 1
    find('.vd-strip').hidden = !multiple
    find('.vd-light-controls').hidden = !multiple
    find('.vd-slider').tabIndex = multiple ? 0 : -1
    const first = model.images[0]
    find('.vd-frame').style.setProperty('--vd-ratio', first.width && first.height ? first.width + ' / ' + first.height : '16 / 9')
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
