import type { Backdrop } from './gl-background'
import { calm, el } from './shared'

// The Easter egg: zooming out (pinching on the trackpad, ⌘ − or Ctrl −) pulls the camera back, and back, until the
// landscape sits in a snow globe. To return: a click, Escape, or zooming in (pinching, ⌘ +, ⌘ 0). On a phone: a
// two-finger pinch (fingers closing). For whoever asked for less motion: the pullback is shorter, and the globe stays
// still once there (no turning, no falling snow).
// Drives the backdrop's `pullback` setting (0…1), and fades the page around it (--pullback, see cards.css). Only
// zooming out is taken from the browser: zooming the page stays possible, except to come back from the globe.
export function snowGlobe(backdrop: Backdrop) {
  let target = 0, pullback = 0, running = false, inside = false
  const away = () => target > 0 || pullback > 0        // pulling back has started (or we are coming back)
  // the page zoomed in by the browser (⌘ +, a pinch, or a zoom the browser remembers for this site): zooming out is then
  // the browser's, until the page is back at 100 %; only then does zooming out pull back into the globe
  // (a pinch shows in visualViewport; ⌘ + changes devicePixelRatio, which at 100 % is the screen's own, a whole
  // number on most screens: 2.2 or 2.5 mean a zoom, and so does any rise since the page opened)
  const startDpr = devicePixelRatio
  // (with a mouse or trackpad, a ratio above 2 means a zoom too: no such screen at 100 %, whereas 150 % or 200 % of a
  // Retina screen give a whole 3 or 4)
  const mouse = matchMedia('(pointer: fine)').matches
  const pageZoomed = () => (visualViewport && visualViewport.scale > 1.01) || devicePixelRatio > startDpr * 1.02
    || Math.abs(devicePixelRatio - Math.round(devicePixelRatio)) > .05 || (mouse && devicePixelRatio > 2.05)
  const hint = el(`<p class="globe-hint mono">${matchMedia('(pointer: coarse)').matches ? 'toucher' : 'cliquer'} pour y retourner</p>`)
  document.body.append(hint)
  function aim(v: number) {
    target = Math.min(1, Math.max(0, v))
    if (!running) { running = true; requestAnimationFrame(frame) }
  }
  function frame() {
    pullback += (target - pullback) * (calm ? .14 : .045)   // softly, never a jolt
    if (Math.abs(target - pullback) < .0005) pullback = target
    backdrop.set('pullback', pullback)
    document.documentElement.style.setProperty('--pullback', String(pullback))
    // in the globe, the (faded) page can neither be clicked nor reached with the keyboard
    if ((pullback > .5) !== inside) {
      inside = pullback > .5
      document.documentElement.classList.toggle('in-globe', inside)
      document.querySelectorAll<HTMLElement>('.top-bar, .scene, .project-layer').forEach((e) => { e.inert = inside })
    }
    running = pullback !== target || (!calm && pullback > 0)   // the snow falls while we are out (unless calm)
    if (running) requestAnimationFrame(frame)
  }
  // a trackpad pinch arrives as a wheel event with Ctrl: zooming out pulls back; zooming in comes back, if away
  addEventListener('wheel', (e) => {
    if (!e.ctrlKey || (e.deltaY < 0 && !away()) || (e.deltaY > 0 && !away() && pageZoomed())) return
    e.preventDefault()
    aim(target + e.deltaY * .012)
  }, { passive: false })
  // coming back: a click anywhere (caught before anything else: it must not open anything)
  addEventListener('click', (e) => {
    if (!away()) return
    e.preventDefault(); e.stopPropagation()
    aim(0)
  }, true)
  // on a phone: a two-finger pinch (closing: pull back; opening: come back, if away)
  let d0 = 0
  const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  addEventListener('touchstart', (e) => { if (e.touches.length === 2) d0 = spread(e.touches) }, { passive: true })
  addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2 || !d0) return
    const d = spread(e.touches)
    if (!away() && (d > d0 || pageZoomed())) return     // on the page: the browser zooms (and unzooms), as usual
    e.preventDefault()
    if (d < d0 * .85) { aim(target + .34); d0 = d } else if (d > d0 * 1.18) { aim(target - .34); d0 = d }
  }, { passive: false })
  addEventListener('gesturestart', (e) => { if (away()) e.preventDefault() })   // Safari: no page zoom in the globe
  // Escape comes back (caught before the project page: it does not close it too); ⌘ − pulls back, ⌘ + and ⌘ 0 return
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && away()) { e.stopImmediatePropagation(); aim(0); return }
    if (!(e.metaKey || e.ctrlKey)) return
    if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') { if (!away() && pageZoomed()) return; e.preventDefault(); aim(target + .34) }
    else if (!away()) return
    else if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') { e.preventDefault(); aim(target - .34) }
    else if (e.key === '0') { e.preventDefault(); aim(0) }
  }, true)
}
