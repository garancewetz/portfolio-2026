import { detect, look } from './browser'
import { bar, barHeight, type Info } from './bars'
import { doors, type Place } from './door'
import { path as walked, picture } from './path'

// La fenêtre du navigateur de la personne (le sien, à peu près : Chrome, Safari, Firefox, Edge ou Brave ; sur Mac
// ou non ; en clair ou en sombre) ; dans la fenêtre, la page vue juste avant (son titre, son adresse, sa capture) ;
// dans cette page, une fenêtre avec la page d'avant… jusqu'à la première page de la visite, tout au fond. En
// faisant défiler (ou en glissant le doigt), on plonge : on remonte son propre chemin dans le site.

const BG = '#f6f4ef'
// la place autour de la première fenêtre : en haut, celle de la ligne du carnet ; sur les côtés et en bas, un
// liseré. Les suivantes, plus petites, laissent voir la page où elles sont posées.
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
  // le chemin : la page vue juste avant d'abord, puis celle d'avant… (et leurs captures, chargées au besoin)
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
  // chaque niveau : sa fenêtre (x, y) et l'échelle de la page qu'elle montre (s : aussi sa largeur, en part de la
  // page) ; le niveau 0, c'est cette page-ci
  let geo: { x: number; y: number; s: number }[] = []
  // u : où l'on en est de la plongée, en niveaux (0 : ici ; steps.length : la première page de la visite)
  let u = 0
  let dirty = true
  // les vraies pages, dans leurs fenêtres (voir door.ts)
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

  // la capture d'une page, qui couvre toute la page (centrée, ce qui dépasse est coupé)
  function cover(img: HTMLImageElement) {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)
    if (!img.complete || !img.naturalWidth) return
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const w = img.naturalWidth * k
    const h = img.naturalHeight * k
    ctx.drawImage(img, (W - w) / 2, 0, w, h)
  }

  // la page d (0 : celle-ci ; d : la d-ième page avant), et dans sa fenêtre la page d'avant… (k : sa taille à
  // l'écran, en part de la page)
  function page(d: number, k: number) {
    if (d === 0) {
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)
    } else cover(shots[d - 1])
    // (au fond du chemin, ou plus petite qu'un point : on s'arrête)
    if (d >= steps.length || k * at(d).s * W < 2) return
    const { x, y, s } = at(d)
    const w = s * W
    const h = C + s * H
    const r = who.mac ? 10 : 8
    // la fenêtre : son ombre (large et douce, comme sur un Mac), sa barre, la page dedans, son filet
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
    // entre deux niveaux n et n + 1 : la page n, agrandie autour du point qui reste en place quand on passe de
    // l'une à l'autre (à u = n + 1, la page n + 1 remplit l'écran)
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
    // les vraies pages, chacune posée sur la page de sa fenêtre, même toute petite au fond du tunnel (la même page
    // du début à la fin : rien ne saute quand on s'en approche). Leur place à l'écran : celle qui remplit l'écran
    // (agrandie), puis on descend de fenêtre en fenêtre, chacune décale et réduit la suivante
    const places: (Place | null)[] = steps.map(() => null)
    let ox = px * (1 - z)
    let oy = py * (1 - z)
    let k = z
    // (le trou d'une page : la fenêtre posée dedans, s'il y en a une)
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
    // (la ligne du carnet ne sert qu'ici : elle s'efface en plongeant)
    const nav = document.querySelector<HTMLElement>('.carnet')
    nav?.style.setProperty('opacity', String(Math.max(0, 1 - u * 2)))
    nav?.style.setProperty('visibility', u < 0.5 ? '' : 'hidden')
    // (une page du chemin remplit l'écran : on peut y retourner, d'un clic)
    canvas.style.cursor = reached() ? 'pointer' : ''
  }

  // la page du chemin qui occupe l'écran (la plus proche : son rang, de 1 à steps.length), ou 0 (ici, Abyme)
  const reached = () => Math.round(u)
  // un clic sur elle : on y retourne (l'accueil, au fond ; ou une page en chemin)
  canvas.addEventListener('click', () => {
    const n = reached()
    if (n) location.href = steps[n - 1].path
  })

  // faire défiler, glisser le doigt, ou les flèches : on plonge (ou on remonte), jusqu'au début de la visite
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
