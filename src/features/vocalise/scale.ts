import { hue, noteName } from './pitch'

// La gamme, sur le bord gauche : chaque demi-ton à sa hauteur, une pastille de sa couleur (les notes blanches du
// piano avec leur nom, les noires plus petites), et un trait très pâle à travers la page à chaque do. La note
// chantée s'allume. C'est la règle du ruban, sous les yeux : la même hauteur, la même couleur.

const FONT = `10px 'JetBrains Mono', ui-monospace, monospace`
const NATURAL = [0, 2, 4, 5, 7, 9, 11]

export function scale(
  g: CanvasRenderingContext2D,
  W: number,
  lo: number,
  hi: number,
  yOf: (m: number) => number,
  sung: number | null,
) {
  g.font = FONT
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  const lit = sung === null ? null : Math.round(sung)
  for (let m = Math.ceil(lo); m <= Math.floor(hi); m++) {
    const y = yOf(m)
    const natural = NATURAL.includes(((m % 12) + 12) % 12)
    const on = m === lit
    g.fillStyle = `hsl(${hue(m)} 85% ${on ? 65 : 45}%)`
    g.beginPath()
    g.arc(16, y, on ? 4 : natural ? 2.5 : 1.5, 0, Math.PI * 2)
    g.fill()
    if (natural) {
      g.fillStyle = on ? 'rgb(255 255 255 / 0.9)' : 'rgb(255 255 255 / 0.32)'
      g.fillText(noteName(m), 26, y)
    }
    if (m % 12 === 0) {
      g.fillStyle = 'rgb(255 255 255 / 0.05)'
      g.fillRect(64, Math.round(y), W - 64, 1)
    }
  }
}
