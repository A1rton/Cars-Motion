import '@fontsource-variable/inter'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import './style.css'

gsap.registerPlugin(ScrollTrigger, Flip)

// These destinations are deliberately reserved. Assign a URL here when each
// independent page is developed; every navigation control uses the same map.
const pages = {
  nosotros: { title:'Nuestra historia, muy pronto.', description:'Estamos preparando un espacio para que conozcas más de CarsMotion y de nuestra pasión por los automóviles.', href:null },
  autos: { title:'Tu próximo auto está por llegar.', description:'Estamos preparando nuestra colección. Mientras tanto, recorré las imágenes y descubrí el universo CarsMotion.', href:null },
  contacto: { title:'Pronto vamos a estar más cerca.', description:'Nuestro espacio de contacto está en camino. Muy pronto vas a poder conversar con CarsMotion.', href:null },
}

const brandPages = {
  porsche: { name: 'Porsche', href: null },
  lexus: { name: 'Lexus', href: null },
  'mercedes-benz': { name: 'Mercedes-Benz', href: null },
  'alfa-romeo': { name: 'Alfa Romeo', href: null },
  bmw: { name: 'BMW', href: null },
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

function setupMotion() {
  if (disposed) return
  filterAnimation?.progress(1).kill()
  filterAnimation = null
  animations?.revert()
  animations = null
  tileReveal = null
  document.documentElement.classList.toggle('motion-paused', reduced())
  toggle.setAttribute('aria-pressed', String(reduced()))
  // A system preference is not an enabled action. Keep its label and disabled
  // state honest instead of offering a button that cannot activate motion.
  toggle.disabled = media.matches
  toggle.title = media.matches ? 'El movimiento reducido está activado en tu dispositivo.' : ''
  toggle.innerHTML = media.matches
    ? 'Movimiento reducido del sistema <span aria-hidden="true">Ⅱ</span>'
    : `${motionPaused ? 'Activar animaciones' : 'Pausar animaciones'} <span aria-hidden="true">${motionPaused ? '▷' : 'Ⅱ'}</span>`
  if (reduced()) return
  animations = gsap.context(() => {
    if (!introPlayed && scrollY < 150) {
      const intro = gsap.timeline({defaults:{ease:'power3.out'}})
      intro.from('.title-line>span',{yPercent:110,duration:1,stagger:.11},.1)
        .from('.hero-in',{y:22,opacity:0,duration:.8,stagger:.1},.48)
        .from('.hero-image-frame',{clipPath:'inset(0 0 100% 0 round 22px)',y:25,duration:1.25},.15)
        .from('.hero-image-frame>img',{scale:1.1,duration:1.65},.15)
        .from('.hero-note',{y:25,opacity:0,duration:.7},.95)
      introPlayed = true
    }
    gsap.to('.hero-image-frame>img',{yPercent:7,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}})
    $$('[data-reveal]').forEach(element => {
      gsap.from(element,{y:34,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 91%',toggleActions:'play none none reverse'}})
    })
    // The reference's offset floating elements settle as the section arrives.
    gsap.fromTo('.photo-back',{y:90,rotation:-13},{y:-16,rotation:-6,ease:'none',scrollTrigger:{trigger:'.experience',start:'top 92%',end:'bottom 30%',scrub:1}})
    gsap.fromTo('.photo-front',{y:150,rotation:12},{y:-28,rotation:6,ease:'none',scrollTrigger:{trigger:'.experience',start:'top 92%',end:'bottom 30%',scrub:1.2}})
    gsap.from('.experience-label',{y:30,opacity:0,duration:.8,scrollTrigger:{trigger:'.experience',start:'top 55%',toggleActions:'play none none reverse'}})
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
let menuOpen=false
let menuOverflow=''
function setMenu(open, restoreFocus=true){
  if(open===menuOpen)return
  menuOpen=open
  menu.hidden=!open
  menuButton.setAttribute('aria-expanded',String(open))
  menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')
  $('.header').classList.toggle('menu-open',open)
  $('main').inert=open
  $('.footer').inert=open
  if(open){menuOverflow=document.body.style.overflow;document.body.style.overflow='hidden';menu.querySelector('a').focus()}
  else{document.body.style.overflow=menuOverflow;if(restoreFocus)menuButton.focus()}
}
on(menuButton,'click',()=>setMenu(!menuOpen))
on(menu.querySelector('a'),'click',()=>setMenu(false))
on($('.header .logo-link'),'click',()=>setMenu(false,false))
on(matchMedia('(min-width: 901px)'),'change',event=>{
  if(event.matches && menuOpen) {setMenu(false,false);$('.header .logo-link').focus({preventScroll:true})}
})
on(document,'keydown',event=>{
  if(!menuOpen)return
  if(event.key==='Escape'){event.preventDefault();setMenu(false);return}
  if(event.key==='Tab'){
    const items=[menuButton,...menu.querySelectorAll('a,button')]
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

// Keep the hit target still while the emblem follows the pointer's angle.
$$('.brand-button').forEach(button => {
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

$$('[data-page]').forEach(button=>on(button,'click',()=>{
  const key = button.dataset.page
  const brand = brandPages[key]
  const page = brand ? {
    title: `Autos ${brand.name}`,
    description: `Estamos preparando la selección de ${brand.name}. Pronto vas a poder explorarla acá.`,
    href: brand.href,
  } : pages[key]
  if(!page)return
  if(page.href){location.href=page.href;return}
  const fromMenu=menu.contains(button)
  setMenu(false,false)
  $('#future-title').textContent=page.title
  $('#future-description').textContent=page.description
  openDialog(futureDialog,fromMenu?menuButton:button)
}))
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

if(import.meta.hot)import.meta.hot.dispose(()=>{
  disposed=true
  setMenu(false,false)
  $$('dialog[open]').forEach(closeDialog)
  events.abort()
  cancelAnimationFrame(progressFrame)
  filterAnimation?.kill()
  animations?.revert()
  document.documentElement.classList.remove('motion-paused')
})
