import { palette, theme } from './theme'

// Les traits : chaque créature tire derrière elle un petit trait de sa couleur, partout où elle passe (en marchant,
// en grimpant, en sautant, en volant). Les traits restent : le paysage devient peu à peu le dessin de leurs
// promenades.
// Dessinés sur une toile sous les créatures : un bout à la fois quand elles avancent ; en entier quand la nuit
// tombe (ou quand la page change de taille).

// tous les combien de pixels on ajoute un point
const GAP = 3

type Point = { x: number; y: number }

export function trails(room: HTMLElement, count: number) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cr-trails'
  canvas.setAttribute('aria-hidden', 'true')
  room.prepend(canvas)
  const ctx = canvas.getContext('2d')!

  // une couleur par créature, celles du jour ou de la nuit (voir theme.ts ; au-delà, on recommence)
  const color = (i: number) => palette().trails[i % palette().trails.length]
  // (tous les points, x dans le paysage, y depuis le bas)
  const lines: Point[][] = Array.from({ length: count }, () => [])
  let lit = NaN // (le jour ou la nuit, au dernier dessin en entier)

  // un bout de trait, de a à b
  const segment = (a: Point, b: Point) => {
    const h = room.clientHeight
    ctx.moveTo(a.x, h - a.y - 1)
    ctx.lineTo(b.x, h - b.y - 1)
  }
  const fit = () => {
    const dpr = devicePixelRatio || 1
    canvas.width = room.clientWidth * dpr
    canvas.height = room.clientHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.9
    lit = NaN
  }
  fit()
  addEventListener('resize', fit)

  return {
    // la créature i est passée là (ses pieds)
    print(i: number, x: number, y: number) {
      const line = lines[i]
      const last = line[line.length - 1]
      if (last && Math.hypot(last.x - x, last.y - y) < GAP) return
      const p = { x, y }
      line.push(p)
      if (!last || lit !== theme.v) return
      ctx.strokeStyle = color(i)
      ctx.beginPath()
      segment(last, p)
      ctx.stroke()
    },
    // à chaque image : si la nuit est tombée (ou la page a changé de taille), tout redessiner
    paint() {
      if (lit === theme.v) return
      lit = theme.v
      ctx.clearRect(0, 0, room.clientWidth, room.clientHeight)
      lines.forEach((line, i) => {
        ctx.strokeStyle = color(i)
        ctx.beginPath()
        for (let k = 1; k < line.length; k++) {
          segment(line[k - 1], line[k])
        }
        ctx.stroke()
      })
    },
  }
}
