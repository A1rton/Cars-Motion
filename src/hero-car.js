// A single horizontal arrival. The car rests afterwards and leaves the viewport
// with normal page scrolling; the supplied reference does not show a full exit.
export function createHeroCar({ gsap, reduced, signal }) {
  const stage = document.querySelector('.hero-car-stage')
  const car = stage?.querySelector('.hero-car')
  const image = stage?.querySelector('.hero-car-image')
  const rotors = [...(stage?.querySelectorAll('.hero-wheel-rotor') ?? [])]
  const images = [image, ...rotors].filter(Boolean)
  const fallback = stage?.querySelector('.hero-fallback')
  if (!stage || !car || !image) {
    return { refreshMotion() {}, dispose() {}, readyPromise: Promise.resolve(false) }
  }

  const events = new AbortController()
  let disposed = false
  let ready = false
  let arrivalConsumed = false
  let context = null
  let arrival = null
  let width = null
  let resizeFrame = 0

  stage.dataset.carReady = 'loading'

  function visible() {
    const bounds = stage.getBoundingClientRect()
    return bounds.bottom > 0 && bounds.top < window.innerHeight
  }

  function rest() {
    // Own context: no changes to the other ScrollTriggers or hero text animation.
    context?.revert()
    context = null
    arrival = null
  }

  function refreshMotion() {
    if (disposed || !ready) return
    // A background tab must not spend its arrival before the visitor sees it.
    if (document.hidden) {
      if (arrival) rest()
      return
    }
    const nextWidth = stage.clientWidth
    const resized = width !== null && Math.abs(nextWidth - width) > 0.5
    width = nextWidth
    const stationary = reduced()
    if (stationary || resized || !visible()) rest()
    // On a short screen the stage may start below the fold.
    if (!nextWidth || (!stationary && !visible())) return
    stage.dataset.carReady = 'true'
    fallback?.setAttribute('aria-hidden', 'true')
    if (arrivalConsumed) return
    arrivalConsumed = true
    if (stationary) return

    const distance = nextWidth + 40
    const wheels = rotors.map(rotor => ({
      rotor,
      radius: rotor.closest('.hero-wheel').getBoundingClientRect().width / 2,
    }))
    context = gsap.context(() => {
      const wheelSetters = wheels.map(({ rotor, radius }) => {
        // Register the initial transform in this context for pause/HMR cleanup.
        gsap.set(rotor, { rotation: distance / radius * 180 / Math.PI })
        return { set: gsap.quickSetter(rotor, 'rotation', 'deg'), radius }
      })
      const updateWheels = () => {
        const x = Number(gsap.getProperty(car, 'x'))
        // x decreases as the car travels left, so the wheel rolls anticlockwise.
        // Both use the same eased displacement; no independent looping tween.
        wheelSetters.forEach(({ set, radius }) => set(x / radius * 180 / Math.PI))
      }
      arrival = gsap.fromTo(car, { x: distance }, {
        x: 0,
        delay: 0.2,
        duration: window.innerWidth <= 900 ? 1.45 : 1.8,
        ease: 'power2.inOut',
        overwrite: 'auto',
        onUpdate: updateWheels,
        onComplete() {
          arrival = null
          wheelSetters.forEach(({ set }) => set(0))
          // Both chassis and wheel angles rest at exactly zero, without a loop.
        },
      })
    }, stage)
  }

  function onResize() {
    if (resizeFrame) return
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0
      refreshMotion()
    })
  }

  function dispose() {
    if (disposed) return
    disposed = true
    events.abort()
    inView.disconnect()
    signal?.removeEventListener('abort', dispose)
    cancelAnimationFrame(resizeFrame)
    rest()
    delete stage.dataset.carReady
    fallback?.removeAttribute('aria-hidden')
  }

  window.addEventListener('resize', onResize, { passive: true, signal: events.signal })
  document.addEventListener('visibilitychange', refreshMotion, { signal: events.signal })
  const inView = new IntersectionObserver(refreshMotion)
  inView.observe(stage)
  signal?.addEventListener('abort', dispose, { once: true })

  // Start the motion before revealing the decoded image. This avoids a flash at
  // its final location and keeps the original photograph visible on any failure.
  const readyPromise = new Promise(resolve => {
    let settled = false
    let decoding = false

    function finish(success) {
      if (settled) return
      settled = true
      images.forEach(asset => asset.removeEventListener('load', load))
      events.signal.removeEventListener('abort', fail)
      resolve(success)
    }

    function fail() {
      if (!disposed) {
        ready = false
        stage.dataset.carReady = 'false'
        fallback?.removeAttribute('aria-hidden')
        rest()
      }
      finish(false)
    }

    async function load() {
      if (settled || decoding || disposed) return
      if (!images.every(asset => asset.complete && asset.naturalWidth > 0)) return
      decoding = true
      try {
        await Promise.all(images.map(asset => typeof asset.decode === 'function' ? asset.decode() : undefined))
        if (disposed || events.signal.aborted) return finish(false)
        if (images.some(asset => !asset.naturalWidth)) return fail()
        ready = true
        refreshMotion()
        finish(true)
      } catch {
        fail()
      }
    }

    images.forEach(asset => {
      asset.addEventListener('load', load, { signal: events.signal })
      // Keep error coverage after decode, including responsive srcset failures.
      asset.addEventListener('error', fail, { signal: events.signal })
    })
    events.signal.addEventListener('abort', fail, { once: true })
    if (images.some(asset => asset.complete && !asset.naturalWidth)) fail()
    else load()
  })

  if (signal?.aborted) dispose()
  return { refreshMotion, dispose, readyPromise }
}
