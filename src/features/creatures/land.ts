import { palette } from './theme'

// Le paysage : trois fils parallèles, l'un au-dessus de l'autre, qui traversent la page d'un bord à l'autre. Ils sont
// très lâches : ils pendent, plient sous les pieds, et rebondissent fort quand quelqu'un s'y pose (d'autant plus
// qu'elle tombe de haut) : toute leur longueur monte et descend, comme un trampoline. Celui du bas retient celles qui
// tombent. Le visiteur peut les pincer, d'un clic : ils vibrent. Dessinés sur une toile, sous les créatures.

// (en part de la hauteur de la page, depuis le bas) où les fils s'accrochent aux bords ; combien ils pendent au milieu
const HOOKS = [0.3, 0.55, 0.8]
const SAG = 0.16
// en pixels : combien un fil plie sous une créature ; combien il rebondit quand elle s'y pose (le moins, le plus) ;
// combien il vibre quand on le pince ; (en pixels par seconde) de combien sa chute le fait rebondir plus
const PRESS = 9
const SWING = [10, 70]
const PLUCK = 24
const IMPACT = 0.09
// (par seconde) comme ils s'apaisent ; (en pixels) à quelle distance du fil le clic le pince
const CALM = 1.3
const REACH = 16

// un rebond, ou une vibration : le fil, sa force, son âge, sa fréquence
type Swing = { i: number; a: number; t: number; f: number }

export function landscape(room: HTMLElement) {
  // la hauteur d'un fil en x (en pixels, depuis le bas), sans le poids des créatures
  const base = (i: number, x: number) => {
    const t = Math.max(0, Math.min(1, x / room.clientWidth))
    return room.clientHeight * (HOOKS[i] - SAG * 4 * t * (1 - t))
  }

  // le poids des créatures sur les fils (celles de l'image d'avant), et leurs rebonds
  let held: { i: number; x: number }[] = []
  let next: { i: number; x: number }[] = []
  let swings: Swing[] = []
  // (la forme d'un rebond, en x : rien aux bords, le plus au milieu)
  const shape = (x: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, x / room.clientWidth)))
  const bend = (i: number, x: number) => {
    let d = 0
    for (const w of held) if (w.i === i) d += PRESS * Math.exp(-(((x - w.x) / 90) ** 2))
    for (const s of swings) if (s.i === i) d += s.a * Math.sin(s.t * s.f) * shape(x)
    return d
  }
  const swing = (i: number, a: number, f: number) => swings.push({ i, a, t: 0, f })
  // (jamais sous le fil du dessous)
  const y = (i: number, x: number): number => {
    const v = base(i, x) - bend(i, x)
    return i ? Math.max(v, y(i - 1, x) + 24) : Math.max(4, v)
  }

  const canvas = document.createElement('canvas')
  canvas.className = 'cr-wires'
  canvas.setAttribute('aria-hidden', 'true')
  room.prepend(canvas)
  const ctx = canvas.getContext('2d')!

  // (le visiteur pince un fil, d'un clic : il vibre ; la main le montre, quand on passe dessus)
  const touched = (e: PointerEvent) => {
    const r = room.getBoundingClientRect()
    const x = e.clientX - r.left
    const py = r.bottom - e.clientY
    return HOOKS.findIndex((_, i) => Math.abs(y(i, x) - py) < REACH)
  }
  room.addEventListener('pointerdown', (e) => {
    const i = touched(e)
    if (i >= 0) swing(i, PLUCK, 14)
  })
  room.addEventListener('pointermove', (e) => (room.style.cursor = touched(e) >= 0 ? 'pointer' : ''))

  return {
    // le nombre de fils
    count: HOOKS.length,
    y,
    // la pente du fil i en x (positive : il monte vers la droite)
    slope: (i: number, x: number) => (y(i, x + 4) - y(i, x - 4)) / 8,
    // en tombant de la hauteur was à y, en x : le premier fil qu'elle traverse (celui du bas la retient toujours)
    reach(was: number, to: number, x: number) {
      // (un peu de marge : un fil qui rebondit vers le haut ne la laisse pas passer au travers)
      for (let i = HOOKS.length - 1; i > 0; i--) if (was >= y(i, x) - 8 && to <= y(i, x)) return i
      return to <= y(0, x) ? 0 : -1
    },
    // une créature est sur le fil i, en x ; elle vient de s'y poser (en tombant à cette vitesse)
    press: (i: number, x: number) => next.push({ i, x }),
    kick: (i: number, x: number, fall = 0) => swing(i, Math.min(SWING[1], SWING[0] + fall * IMPACT) * shape(x), 6),
    // combien le fil i rebondit en x, en ce moment (en pixels)
    shake: (i: number, x: number) => swings.reduce((d, s) => (s.i === i ? d + s.a * shape(x) : d), 0),

    // à chaque image : les rebonds s'apaisent ; les fils
    draw(dt: number) {
      held = next
      next = []
      for (const s of swings) {
        s.t += dt
        s.a *= Math.exp(-CALM * dt)
      }
      swings = swings.filter((s) => s.a > 0.3)
      const dpr = devicePixelRatio || 1
      const w = room.clientWidth
      const h = room.clientHeight
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = palette().line
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i < HOOKS.length; i++)
        for (let sx = 0; sx <= w + 6; sx += 6) {
          const py = h - y(i, sx)
          if (sx) ctx.lineTo(sx, py)
          else ctx.moveTo(sx, py)
        }
      ctx.stroke()
    },
  }
}

export type Land = ReturnType<typeof landscape>
