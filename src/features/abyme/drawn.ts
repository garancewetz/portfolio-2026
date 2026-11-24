import { detect, look } from './browser'
import { bar, barHeight, type Info } from './bars'
import { doors, type Place } from './door'
import { path as walked, picture } from './path'

// The visitor's browser window (theirs, roughly: Chrome, Safari, Firefox, Edge or Brave; on a Mac or not;
// light or dark); in the window, the page seen just before (its title, its address, its screenshot); in that
// page, a window with the page before… down to the first page of the visit, at the very bottom. By scrolling
// (or sliding a finger), you dive: you walk back up your own path through the site.

const BG = '#ffffff'
// the room around the first window: at the top, the notebook line's; on the sides and at the bottom, a thin
// border. The next ones, smaller, let the page they sit on show.
const TOP = 40
const EDGE = 16
const INNER = 0.62

export function drawn(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const who = detect()
  const lk = look(who.kind, who.dark)
  const C = barHeight(who.kind)
  const drawBar = bar(who.kind)
  const favicon = new Image()
  favicon.src = '/favicon.svg'
  favicon.onload = () => (dirty = true)
  // the path: the page seen just before first, then the one before… (and their screenshots, loaded as needed)
  const steps = walked()
  const shots = steps.map((s) => {
    const img = new Image()
    img.onload = () => (dirty = true)
    img.src = picture(s.path)
    return img
  })
  const info = (k: number): Info => ({
    title: steps[k].title,
    host: location.host,
    path: steps[k].path === '/' ? '' : steps[k].path.replace(/\/$/, '').replace(/\/#/, '#'),
    mac: who.mac,
    favicon,
  })

  let W = 0
  let H = 0
  // each level: its window (x, y) and the scale of the page it shows (s: also its width, as a share of the
  // page); level 0 is this very page
  let geo: { x: number; y: number; s: number }[] = []
  // u: how far the dive has gone, in levels (0: here; steps.length: the first page of the visit)
  let u = 0
  let dirty = true
  // the real pages, in their windows (see door.ts)
  const live = doors(
    canvas.parentElement!,
    steps.map((s) => s.path),
    (delta) => dive(delta / 700),
    () => u >= steps.length,
  )

  function resize() {
    const dpr = Math.min(2, devicePixelRatio || 1)
    W = canvas.clientWidth
    H = canvas.clientHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const s0 = Math.max(0.3, Math.min(0.92, (H - TOP - EDGE - C) / H, (W - 2 * EDGE) / W))
    const s1 = Math.min(INNER, (H - 2 * TOP - C) / H)
    geo = [
      { s: s0, x: (W - s0 * W) / 2, y: TOP + Math.max(0, (H - TOP - EDGE - C - s0 * H) / 2) },
      { s: s1, x: (W - s1 * W) / 2, y: (H - C - s1 * H) / 2 + TOP / 2 },
    ]
    dirty = true
  }
  const at = (d: number) => geo[Math.min(d, 1)]

  // a page's screenshot, covering the whole page (centred, whatever overflows is cut)
  function cover(img: HTMLImageElement) {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)
    if (!img.complete || !img.naturalWidth) return
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const w = img.naturalWidth * k
    const h = img.naturalHeight * k
    ctx.drawImage(img, (W - w) / 2, 0, w, h)
  }

  // page d (0: this one; d: the d-th page before), and in its window the page before… (k: its on-screen size,
  // as a share of the page)
  function page(d: number, k: number) {
    if (d === 0) {
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
    } else cover(shots[d - 1])
    // (at the end of the path, or smaller than a dot: stop)
    if (d >= steps.length || k * at(d).s * W < 2) return
    const { x, y, s } = at(d)
    const w = s * W
    const h = C + s * H
    const r = who.mac ? 10 : 8
    // the window: its shadow (wide and soft, like on a Mac), its bar, the page inside, its hairline
    ctx.save()
    ctx.shadowColor = 'rgb(0 0 0 / 0.3)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 14
    ctx.fillStyle = lk.bar
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.clip()
    drawBar(ctx, x, y, w, lk, info(d))
    ctx.translate(x, y + C)
    ctx.scale(s, s)
    page(d + 1, k * s)
    ctx.restore()
    ctx.strokeStyle = who.dark ? 'rgb(255 255 255 / 0.12)' : 'rgb(0 0 0 / 0.14)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(x - 0.5, y - 0.5, w + 1, h + 1, r)
    ctx.stroke()
  }

  function draw() {
    requestAnimationFrame(draw)
    if (!dirty || !W) return
    dirty = false
    const dpr = canvas.width / W
    // between two levels n and n + 1: page n, enlarged around the point that stays put when going from one to
    // the other (at u = n + 1, page n + 1 fills the screen)
    const n = Math.min(Math.floor(u), steps.length)
    const { x, y, s } = at(n)
    const z = Math.pow(1 / s, u - n)
    const px = x / (1 - s)
    const py = (y + C) / (1 - s)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.translate(px, py)
    ctx.scale(z, z)
    ctx.translate(-px, -py)
    page(n, z)
    // the real pages, each laid on its window's page, even tiny at the bottom of the tunnel (the same page from
    // start to end: nothing jumps as you get closer). Their place on screen: the one filling the screen
    // (enlarged), then down from window to window, each one shifting and shrinking the next
    const places: (Place | null)[] = steps.map(() => null)
    let ox = px * (1 - z)
    let oy = py * (1 - z)
    let k = z
    // (a page's hole: the window laid inside it, if there is one)
    const hole = (d: number) => {
      if (d >= steps.length) return undefined
      const g = at(d)
      return { x: g.x, y: g.y, w: g.s * W, h: C + g.s * H }
    }
    if (n >= 1) places[n - 1] = { left: ox, top: oy, scale: k, r: 0, hole: hole(n) }
    for (let d = n; d < steps.length; d++) {
      const g = at(d)
      const r = (who.mac ? 10 : 8) * k
      ox += k * g.x
      oy += k * (g.y + C)
      k *= g.s
      if (k * W > 24) places[d] = { left: ox, top: oy, scale: k, r, hole: hole(d + 1) }
    }
    live.place(places, W, H)
    // (the notebook line only matters here: it fades out while diving)
    const nav = document.querySelector<HTMLElement>('.carnet')
    nav?.style.setProperty('opacity', String(Math.max(0, 1 - u * 2)))
    nav?.style.setProperty('visibility', u < 0.5 ? '' : 'hidden')
    // (a page of the path fills the screen: you can go back to it, with a click)
    canvas.style.cursor = reached() ? 'pointer' : ''
  }

  // the page of the path that fills the screen (the closest: its rank, from 1 to steps.length), or 0 (here, Abyme)
  const reached = () => Math.round(u)
  // a click on it: go back there (the home, at the bottom; or a page along the way)
  canvas.addEventListener('click', () => {
    const n = reached()
    if (n) location.href = steps[n - 1].path
  })

  // scroll, slide a finger, or the arrow keys: dive (or climb back), down to the start of the visit
  const dive = (levels: number) => {
    u = Math.max(0, Math.min(steps.length, u + levels))
    dirty = true
  }
  addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) return
      e.preventDefault()
      dive((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) / 700)
    },
    { passive: false },
  )
  let lastY: number | null = null
  addEventListener('pointerdown', (e) => (lastY = e.clientY))
  addEventListener('pointerup', () => (lastY = null))
  addEventListener('pointermove', (e) => {
    if (lastY === null || e.pointerType === 'mouse') return
    dive((lastY - e.clientY) / 300)
    lastY = e.clientY
  })
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      dive(e.key === 'ArrowDown' ? 0.05 : -0.05)
    }
  })
  addEventListener('resize', resize)
  resize()
  requestAnimationFrame(draw)
}
