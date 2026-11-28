import gsap from 'gsap'

// Section headings and editorial content use the same entrance on every route.
export function revealContent(element, options = {}) {
  return gsap.from(element, { y: 34, opacity: 0, duration: .85, ease: 'power3.out', ...options })
}
