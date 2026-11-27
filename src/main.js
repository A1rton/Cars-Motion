import '@fontsource-variable/inter'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import './style.css'
import { brands } from './catalog-data.js'
import { mountAutoRoutes } from './auto-routes.js'
import { prepareButtonMotion } from './button-motion.js'
import { createHeroCar } from './hero-car.js'

gsap.registerPlugin(ScrollTrigger, Flip)
prepareButtonMotion()

// These destinations are deliberately reserved. Assign a URL here when each
// independent page is developed; every navigation control uses the same map.
const pages = {
  nosotros: { title:'Nuestra historia, muy pronto.', description:'Estamos preparando un espacio para que conozcas más de CarsMotion y de nuestra pasión por los automóviles.', href:null },
  financiacion: { title:'Financiación', description:'Próximamente vas a poder consultar acá las opciones de financiación.', href:null },
  contacto: { title:'Pronto vamos a estar más cerca.', description:'Nuestro espacio de contacto está en camino. Muy pronto vas a poder conversar con CarsMotion.', href:null },
}

const $ = selector => document.querySelector(selector)
const $$ = selector => [...document.querySelectorAll(selector)]
const media = matchMedia('(prefers-reduced-motion: reduce)')
const events = new AbortController()
const on = (target, type, listener, options = {}) => target.addEventListener(type, listener, { ...options, signal: events.signal })
let disposed = false
let motionPaused = false
let animations
let filterAnimation
let tileReveal
let selectionEntered = false
let introPlayed = false
const reduced = () => media.matches || motionPaused
const toggle = $('#motion-toggle')
const heroCar = createHeroCar({ gsap, reduced, signal: events.signal })

function setupMotion() {
  if (disposed) return
  filterAnimation?.progress(1).kill()
  filterAnimation = null
  animations?.revert()
  animations = null
  tileReveal = null
  heroCar.refreshMotion()
  document.documentElement.classList.toggle('motion-paused', reduced())
  toggle.setAttribute('aria-pressed', String(reduced()))
  // A system preference is not an enabled action. Keep its label and disabled
  // state honest instead of offering a button that cannot activate motion.
  toggle.disabled = media.matches
  toggle.title = media.matches ? 'El movimiento reducido está activado en tu dispositivo.' : ''
  toggle.innerHTML = media.matches
    ? 'Movimiento reducido del sistema <span aria-hidden="true">Ⅱ</span>'
    : `<span class="motion-underline">${motionPaused ? 'Activar animaciones' : 'Pausar animaciones'}</span> <span aria-hidden="true">${motionPaused ? '▷' : 'Ⅱ'}</span>`
  if (reduced()) return
  animations = gsap.context(() => {
    if (!introPlayed && !document.hidden && $('.hero').getBoundingClientRect().bottom > 0) {
      const intro = gsap.timeline({defaults:{ease:'power3.out'}})
      intro.fromTo('.title-line>span',{yPercent:110},{yPercent:0,duration:1.2,stagger:.15},.2)
        .from('.hero-in',{y:22,opacity:0,duration:.9,stagger:.1},.55)
      introPlayed = true
    }
    $$('[data-reveal]').forEach(element => {
      gsap.from(element,{y:34,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 91%',toggleActions:'play none none reverse'}})
    })
    // The reference's offset floating elements settle as the section arrives.
    gsap.fromTo('.photo-back',{y:90,rotation:-13},{y:-16,rotation:-6,ease:'none',scrollTrigger:{trigger:'.experience',start:'top 92%',end:'bottom 30%',scrub:1}})
    gsap.fromTo('.photo-front',{y:150,rotation:12},{y:-28,rotation:6,ease:'none',scrollTrigger:{trigger:'.experience',start:'top 92%',end:'bottom 30%',scrub:1.2}})
    if (!selectionEntered) tileReveal = gsap.from('.vehicle-tile',{y:65,opacity:0,scale:.97,duration:.85,stagger:.11,ease:'power3.out',clearProps:'transform',onComplete:()=>{selectionEntered=true},scrollTrigger:{trigger:'.vehicle-grid',start:'top 88%',once:true}})
    gsap.from('.value-card',{y:i=>70+i*26,opacity:0,duration:.9,stagger:.13,ease:'power3.out',scrollTrigger:{trigger:'.values-grid',start:'top 88%',toggleActions:'play none none reverse'}})
    gsap.from('.closing-panel',{y:55,scale:.96,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.closing',start:'top 88%',toggleActions:'play none none reverse'}})
    gsap.to('.closing-image',{yPercent:8,ease:'none',scrollTrigger:{trigger:'.closing',start:'top bottom',end:'bottom top',scrub:1}})
  })
  ScrollTrigger.refresh()
}

on(toggle,'click',()=>{
  if(media.matches) return
  motionPaused=!motionPaused
  setupMotion()
})
on(media,'change',setupMotion)
on(document,'visibilitychange',()=>{if(!document.hidden && !introPlayed)setupMotion()})
setupMotion()
const refreshLayout = () => { if (!disposed) ScrollTrigger.refresh() }
document.fonts.ready.then(refreshLayout)
$$('img').forEach(img=>on(img,'load',refreshLayout,{once:true}))

let progressPending=false
let progressFrame
const progressBar=$('.scroll-progress span')
const header=$('.header')
function updateProgress(){
  const max=document.documentElement.scrollHeight-innerHeight
  progressBar.style.transform=`scaleX(${max>0?scrollY/max:0})`
  header.classList.toggle('has-scrolled',scrollY>30)
  progressPending=false
}
on(window,'scroll',()=>{if(!progressPending){progressPending=true;progressFrame=requestAnimationFrame(updateProgress)}},{passive:true})
on(window,'resize',updateProgress)
updateProgress()

const menu=$('.mobile-navigation')
const menuButton=$('.menu-toggle')
const menuBrands = $('#menu-brands')
for (const brand of brands.filter(brand => brand.logo)) {
  const key = brand.id
  const button = document.createElement('a')
  button.href = '#autos/' + key
  button.dataset.page = key
  const label = document.createElement('span')
  label.className = 'motion-underline'
  label.textContent = brand.name
  button.append(label)
  menuBrands.append(button)
}

// Leave the sheet mounted so its exit transition can finish and reverse mid-flight.
menu.hidden = false
let menuOpen = false
let menuOverflow = ''
function setMenu(open, restoreFocus = true) {
  if (open === menuOpen) return
  menuOpen = open
  menu.inert = !open
  menuButton.setAttribute('aria-expanded', String(open))
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú')
  header.classList.toggle('menu-open', open)
  menu.classList.toggle('is-open', open)
  $$('main').forEach(view => { view.inert = open })
  $('.footer').inert = open
  $('.skip-link').inert = open
  if (open) {
    menu.scrollTop = 0
    menuOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuButton.focus({ preventScroll: true })
  } else {
    document.body.style.overflow = menuOverflow
    if (restoreFocus) menuButton.focus({ preventScroll: true })
  }
}
on(menuButton,'click',()=>setMenu(!menuOpen))
on(menu.querySelector('a'),'click',()=>setMenu(false))
on($('.header .logo-link'),'click',()=>setMenu(false,false))
on(matchMedia('(width > 1024px)'),'change',event=>{
  if(event.matches && menuOpen) {setMenu(false,false);$('.header .logo-link').focus({preventScroll:true})}
})
on(document,'keydown',event=>{
  if(!menuOpen)return
  if(event.key==='Escape'){event.preventDefault();setMenu(false);return}
  if(event.key==='Tab'){
    const items=[$('.header .logo-link'), menuButton,...menu.querySelectorAll('a,button')]
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus()}
    else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus()}
  }
})

const dialogSessions = new WeakMap()
function openDialog(dialog,trigger){
  if(dialog.open)return
  const other=$('dialog[open]')
  if(other)closeDialog(other)
  dialogSessions.set(dialog,{origin:trigger,overflow:document.body.style.overflow})
  document.body.style.overflow='hidden'
  dialog.showModal()
  dialog.querySelector('.dialog-close').focus({preventScroll:true})
}
function restoreDialog(dialog){
  const session=dialogSessions.get(dialog)
  if(!session)return
  dialogSessions.delete(dialog)
  document.body.style.overflow=session.overflow
  if(session.origin?.isConnected && !session.origin.closest('[hidden]'))session.origin.focus({preventScroll:true})
}
function closeDialog(dialog){
  if(!dialog.open)return
  dialog.close()
  restoreDialog(dialog)
}
$$('dialog').forEach(dialog=>{
  on(dialog.querySelector('.dialog-close'),'click',()=>closeDialog(dialog))
  on(dialog,'cancel',event=>{event.preventDefault();closeDialog(dialog)})
  on(dialog,'close',()=>restoreDialog(dialog))
  on(dialog,'click',event=>{
    if(event.target!==dialog)return
    const rect=dialog.getBoundingClientRect()
    if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)closeDialog(dialog)
  })
})
const futureDialog=$('.future-dialog')

const brandTrack = $('#brand-track')
const brandButtons = $$('.brand-button')
const previousBrands = $('.brand-prev')
const nextBrands = $('.brand-next')

function updateBrandArrows() {
  const lastPosition = brandTrack.scrollWidth - brandTrack.clientWidth
  for (const [button, available] of [
    [previousBrands, brandTrack.scrollLeft > 1],
    [nextBrands, brandTrack.scrollLeft < lastPosition - 1],
  ]) {
    button.setAttribute('aria-disabled', String(!available))
    button.tabIndex = available ? 0 : -1
  }
}

function advanceBrands(direction) {
  brandTrack.scrollBy({
    left: direction * brandTrack.clientWidth,
    behavior: reduced() ? 'instant' : 'smooth',
  })
}

on(previousBrands, 'click', () => advanceBrands(-1))
on(nextBrands, 'click', () => advanceBrands(1))
on(brandTrack, 'scroll', updateBrandArrows, { passive: true })
on(window, 'resize', updateBrandArrows)
updateBrandArrows()

on(brandTrack, 'keydown', event => {
  const index = brandButtons.indexOf(event.target)
  if (index === -1) return
  const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: brandButtons.length - 1 }
  if (!Object.hasOwn(destinations, event.key)) return
  event.preventDefault()
  const target = brandButtons[Math.max(0, Math.min(brandButtons.length - 1, destinations[event.key]))]
  target.focus({ preventScroll: true })
  target.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'nearest', inline: 'nearest' })
})

// Keep the hit target still while the emblem follows the pointer's angle.
brandButtons.forEach(button => {
  on(button, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced()) return
    const bounds = button.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    button.style.setProperty('--logo-rotate-x', `${-vertical * 16}deg`)
    button.style.setProperty('--logo-rotate-y', `${horizontal * 22}deg`)
  })
  const resetAngle = () => {
    button.style.removeProperty('--logo-rotate-x')
    button.style.removeProperty('--logo-rotate-y')
  }
  on(button, 'pointerleave', resetAngle)
  on(button, 'pointercancel', resetAngle)
  on(button, 'blur', resetAngle)
})

function showFuture(key, trigger, modelName) {
  const page = pages[key]
  if (!page) return
  const origin = menu.contains(trigger) ? menuButton : trigger
  setMenu(false, false)
  $('#future-title').textContent = page.title
  $('#future-description').textContent = modelName
    ? 'Próximamente vas a poder consultarnos por el ' + modelName + '.'
    : page.description
  openDialog(futureDialog, origin)
}
$$('button[data-page]').forEach(button => on(button, 'click', () => showFuture(button.dataset.page, button)))
on($('.future-back'),'click',()=>closeDialog(futureDialog))

const tiles=$$('.vehicle-tile')
$$('.filter').forEach(button=>on(button,'click',()=>{
  if(button.getAttribute('aria-pressed')==='true')return
  // Finish the section's initial reveal before Flip takes ownership of these
  // same transforms. This also keeps rapid repeated filter clicks deterministic.
  tileReveal?.progress(1)
  tileReveal?.scrollTrigger?.kill()
  tileReveal?.kill()
  tileReveal=null
  selectionEntered=true
  filterAnimation?.progress(1).kill()
  filterAnimation=null
  const filter=button.dataset.filter
  const state=Flip.getState(tiles.filter(tile=>!tile.hidden))
  $$('.filter').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button))})
  tiles.forEach(tile=>{tile.hidden=filter!=='all'&&tile.dataset.category!==filter})
  const visible=tiles.filter(tile=>!tile.hidden)
  gsap.set(visible,{opacity:1,clearProps:'transform'})
  if(!reduced())filterAnimation=Flip.from(state,{targets:visible,duration:.5,ease:'power2.inOut',absolute:false,onComplete:refreshLayout})
  $('#filter-status').textContent=`${visible.length} ${visible.length===1?'imagen':'imágenes'} en ${button.textContent}.`
  ScrollTrigger.refresh()
}))
const imageDialog=$('.image-dialog')
let currentImage=0
function setImage(index){
  currentImage=(index+tiles.length)%tiles.length
  const tile=tiles[currentImage]
  const img=tile.querySelector('img')
  $('#image-title').textContent=tile.querySelector('.tile-caption>span').textContent
  $('#expanded-image').src=`${import.meta.env.BASE_URL}media/${tile.dataset.vehicle}-1600.webp`
  $('#expanded-image').alt=img.alt
}
tiles.forEach((tile,i)=>on(tile,'click',()=>{setImage(i);openDialog(imageDialog,tile)}))
on($('#image-next'),'click',()=>setImage(currentImage+1))
on(imageDialog,'keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();setImage(currentImage+1)}if(event.key==='ArrowLeft'){event.preventDefault();setImage(currentImage-1)}})
$('#year').textContent=String(new Date().getFullYear())

mountAutoRoutes({
  signal: events.signal,
  closeOverlays() {
    setMenu(false, false)
    $$('dialog[open]').forEach(closeDialog)
  },
  contact: (trigger, model) => showFuture('contacto', trigger, model.name),
  reduced,
  refreshHome() {
    updateBrandArrows()
    refreshLayout()
  },
})

if(import.meta.hot)import.meta.hot.dispose(()=>{
  disposed=true
  heroCar.dispose()
  setMenu(false,false)
  $$('dialog[open]').forEach(closeDialog)
  events.abort()
  cancelAnimationFrame(progressFrame)
  filterAnimation?.kill()
  animations?.revert()
  document.documentElement.classList.remove('motion-paused')
})
