import { choices, gear } from '@/features/carnet/gear'

// La traînée : là où il passe (en marchant, en sautant, en grimpant, suspendu, promené), son pied arrière laisse
// un trait sur une toile sous lui. Un trait n'est pas un sol : on passe au travers, on ne s'y pose pas ; mais on
// peut s'y accrocher, et l'escalader dans tous les sens (voir body.ts, 'line'). La traînée reste jusqu'à ce qu'on
// quitte la page, que la fenêtre change de taille, ou qu'il passe la porte. La roue crantée choisit : le crayon
// magique (mine multicolore : plusieurs couleurs côte à côte, qui changent avec le sens du trait), un trait noir,
// des points, ou rien.

const KINDS = ['multicolore', 'trait', 'points', 'rien'] as const
type Kind = (typeof KINDS)[number]
const GAP = 9 // px entre deux points
const INK = '#1a1917'
// le crayon magique (mine multicolore) : la mine mêle plusieurs couleurs en quartiers ; le trait, assez large,
// en montre plusieurs côte à côte, comme des rayures le long de la ligne (un bord bleu, l'autre jaune ou rouge, du
// vert, du violet là où elles se touchent). Selon le sens du trait, la mine frotte le papier par une autre face :
// les couleurs des bords changent. Les quartiers de la mine, dans l'ordre, tout autour :
const LEAD = [
  [47, 95, 176], // bleu
  [233, 197, 45], // jaune
  [217, 83, 43], // rouge orangé
  [72, 48, 120], // violet sombre
]
// la couleur de la mine à cet angle (en tours : 0 à 1), entre deux quartiers, mêlée
function tint(turn: number) {
  const f = ((((turn % 1) + 1) % 1) * LEAD.length) % LEAD.length
  const a = LEAD[Math.floor(f)]
  const b = LEAD[(Math.floor(f) + 1) % LEAD.length]
  const k = f - Math.floor(f)
  return a.map((v, i) => Math.round(v + (b[i] - v) * k))
}
const BANDS = [-2.4, -1.2, 0, 1.2, 2.4] // les rayures, en travers du trait (px)
const FRESH = 400 // ms : le bout qu'il vient de tracer, il ne s'y accroche pas (il est encore sous son pied)
const JUMP = 80 // px d'une image à l'autre : plus loin, c'est un bond (la traînée s'interrompt)

type Seg = { x1: number; y1: number; x2: number; y2: number; t: number }
// le point d'un bout de trait le plus proche de (px, py), et la direction du trait (de son début vers sa fin)
function closest(s: Seg, px: number, py: number) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const len = Math.hypot(dx, dy) || 1
  const k = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / (len * len)))
  const x = s.x1 + dx * k
  const y = s.y1 + dy * k
  return { x, y, ux: dx / len, uy: dy / len, d: Math.hypot(px - x, py - y) }
}

export function createTrail(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  let kind: Kind = 'multicolore'
  let last: { x: number; y: number } | null = null
  let since = 0 // (le chemin depuis le dernier point posé)
  let segs: Seg[] = [] // (ce qu'il a tracé)

  // tout effacer
  const clear = () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    last = null
    segs = []
  }
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    clear()
  }
  resize()
  addEventListener('resize', resize)

  return {
    // son pied arrière est là : la traînée le suit
    to(x: number, y: number) {
      if (!ctx || kind === 'rien') return
      if (!last) {
        last = { x, y }
        return
      }
      const d = Math.hypot(x - last.x, y - last.y)
      if (d < 0.5) return
      // (un bond : attrapé, emporté d'un coup par la souris ; la traînée ne relie pas, elle reprend de là)
      if (d > JUMP) {
        last = { x, y }
        return
      }
      segs.push({ x1: last.x, y1: last.y, x2: x, y2: y, t: performance.now() })
      if (kind === 'multicolore') {
        // des rayures côte à côte, en travers du trait : chacune la face de la mine qui frotte à cet endroit (elles
        // tournent avec le sens du trait) ; le grain du crayon : chaque passage un peu décalé, plus ou moins appuyé
        const dx = x - last.x
        const dy = y - last.y
        const n = { x: -dy / d, y: dx / d } // (en travers du trait)
        const turn = Math.atan2(dy, dx) / (2 * Math.PI)
        // (bouts droits : arrondis, les bouts qui se chevauchent feraient des pointillés plus sombres)
        ctx.lineCap = 'butt'
        const from = last
        BANDS.forEach((off, i) => {
          const [r, g, b] = tint(turn + 0.25 + (i / (BANDS.length - 1)) * 0.5)
          const j = () => (Math.random() - 0.5) * 0.5
          ctx.strokeStyle = `rgb(${r} ${g} ${b} / ${0.5 + Math.random() * 0.25})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(from.x + n.x * off + j(), from.y + n.y * off + j())
          ctx.lineTo(x + n.x * off + j(), y + n.y * off + j())
          ctx.stroke()
        })
      } else if (kind === 'trait') {
        ctx.strokeStyle = INK
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else {
        // des points réguliers, le long du chemin
        ctx.fillStyle = INK
        since += d
        while (since >= GAP) {
          since -= GAP
          const k = 1 - since / d
          ctx.beginPath()
          ctx.arc(last.x + (x - last.x) * k, last.y + (y - last.y) * k, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      last = { x, y }
    },
    // le trait le plus proche de (x, y), à moins de reach px : le point où s'y accrocher, et la direction du trait
    // (pas le bout qu'il vient de tracer, encore sous son pied)
    // (keep : seulement les points qui conviennent, par exemple au-dessus de sa tête)
    near(x: number, y: number, reach: number, keep?: (p: { x: number; y: number; ux: number; uy: number }) => boolean) {
      const now = performance.now()
      let best: ReturnType<typeof closest> | null = null
      for (const s of segs) {
        if (now - s.t < FRESH) continue
        const c = closest(s, x, y)
        if (c.d <= reach && (!best || c.d < best.d) && (!keep || keep(c))) best = c
      }
      return best
    },
    clear,
    // il disparaît d'ici (une autre fenêtre), ou réapparaît ailleurs : la traînée ne les relie pas
    lift() {
      last = null
    },
    // la roue crantée, dans la ligne du carnet
    settings(slot: HTMLElement) {
      gear(slot, 'Réglages de la traînée', [
        choices('traînée', KINDS, kind, (k) => {
          kind = k
          last = null
        }),
      ])
    },
  }
}
