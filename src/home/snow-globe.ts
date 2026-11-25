import type { Backdrop } from './gl-background'
import { calm, el } from './shared'

// Zooming moves the camera. Zooming out (pinching on the trackpad, ⌘ − or Ctrl −) pulls it back, and back, until the
// landscape sits in a snow globe (the Easter egg); to return: a click, Escape, or zooming in (pinching, ⌘ +, ⌘ 0).
// Zooming in moves it forward into the place, a little, and no further: the page itself (the badges, the name, the
// text) never grows. Only a page already zoomed by the browser (a zoom it remembers for the site) can be zoomed back
// out to 100 %, before the camera moves back. On a phone: a two-finger pinch. For
// whoever asked for less motion: shorter moves, and the globe stays still once there (no turning, no falling snow).
// One value, `depth`: below 0 the camera has moved forward (the backdrop's `near`), above 0 it has pulled back
// (`pullback`, 0…1, which also fades the page around it: --pullback, see cards.css).
const FORWARD = .8   // how far zooming in moves forward (the backdrop's `near`)
export function snowGlobe(backdrop: Backdrop) {
  let target = 0, depth = 0, running = false, inside = false
  const away = () => target > 0 || depth > 0          // pulling back has started (or we are coming back)
    // the page zoomed in by the browser (⌘ +, a pinch, or a zoom the browser remembers for this site): zooming out is then
  // the browser's, until the page is back at 100 %
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
    target = Math.min(1, Math.max(-FORWARD, v))
    if (!running) { running = true; requestAnimationFrame(frame) }
  }
  // a step of the keys or of a pinch: smaller forward than back to the globe
  const step = (out: boolean) => (target > 0 || (target === 0 && out) ? .34 : .2)
  function frame() {
    depth += (target - depth) * (calm ? .14 : .045)     // softly, never a jolt
    if (Math.abs(target - depth) < .0005) depth = target
    const pullback = Math.max(0, depth)
    backdrop.set('pullback', pullback)
    backdrop.set('near', Math.max(0, -depth))
    document.documentElement.style.setProperty('--pullback', String(pullback))
    // in the globe, the (faded) page can neither be clicked nor reached with the keyboard
    if ((pullback > .5) !== inside) {
      inside = pullback > .5
      document.documentElement.classList.toggle('in-globe', inside)
      document.querySelectorAll<HTMLElement>('.top-bar, .scene, .project-note').forEach((e) => { e.inert = inside })
    }
    running = depth !== target || (!calm && pullback > 0)   // the snow falls while we are out (unless calm)
    if (running) requestAnimationFrame(frame)
  }
  // zooming in is always the camera's (forward, up to FORWARD, then nothing); zooming out too, except while the page
  // is zoomed by the browser: then the browser first, back to 100 %
  const mine = (zoomIn: boolean) => zoomIn || away() || !pageZoomed()
  // a trackpad pinch arrives as a wheel event with Ctrl
  addEventListener('wheel', (e) => {
    if (!e.ctrlKey || !mine(e.deltaY < 0)) return
    e.preventDefault()
    aim(target + e.deltaY * .012)
  }, { passive: false })
  // coming back from the globe: a click anywhere (caught before anything else: it must not open anything)
  addEventListener('click', (e) => {
    if (!away()) return
    e.preventDefault(); e.stopPropagation()
    aim(0)
  }, true)
  // on a phone: a two-finger pinch (closing: back, then the globe; opening: forward, or out of the globe)
  let d0 = 0
  const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  addEventListener('touchstart', (e) => { if (e.touches.length === 2) d0 = spread(e.touches) }, { passive: true })
  addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2 || !d0) return
    const d = spread(e.touches)
    if (!mine(d > d0)) return                           // the browser zooms (and unzooms), as usual
    e.preventDefault()
    if (d < d0 * .85) { aim(target + step(true)); d0 = d } else if (d > d0 * 1.18) { aim(target - step(false)); d0 = d }
  }, { passive: false })
  addEventListener('gesturestart', (e) => e.preventDefault())   // Safari: the page never zooms in, the camera moves
  // Escape comes back (caught before the note: it does not let it go too); ⌘ − back, ⌘ + forward, ⌘ 0 where it was
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && target !== 0) { e.stopImmediatePropagation(); aim(0); return }
    if (!(e.metaKey || e.ctrlKey)) return
    if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
      if (!mine(false)) return
      e.preventDefault(); aim(target + step(true))
    } else if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
      if (!mine(true)) return
      e.preventDefault(); aim(target - step(false))
    } else if (e.key === '0' && target !== 0) { e.preventDefault(); aim(0) }
  }, true)
}
