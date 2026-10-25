import { COUNT, LAND_SPREAD, ZONES, settle, u } from './flock'
import { VILLAGE_LINES, VILLAGE_W, grid } from './grid'

// ——— Où se poser : sur les toits du village et la pointe du clocher, et sur le bas de la page, à gauche du
// village ———
// la place de chaque oiseau : sa case dans le ciel (colonne, ligne)
export const perchCol = new Int16Array(COUNT)
export const perchRow = new Int16Array(COUNT)
// le ciel dans le dessin du village : les espaces qu'on atteint depuis le haut en descendant ou en allant de côté
// (pas l'intérieur des maisons, fermé par leurs murs et leur toit)
const OPEN = VILLAGE_LINES.map((line) => Array.from({ length: VILLAGE_W }, (_, x) => (line[x] ?? ' ') === ' '))
const SKY = OPEN.map((row) => row.map(() => false))
OPEN.forEach((row, y) => {
  row.forEach((open, x) => (SKY[y][x] = open && (y === 0 || SKY[y - 1][x])))
  for (let changed = true; changed;) {
    changed = false
    for (let x = 0; x < VILLAGE_W; x++) {
      if (row[x] && !SKY[y][x] && (SKY[y][x - 1] || SKY[y][x + 1])) changed = SKY[y][x] = true
    }
  }
})
// la dernière ligne de l'église (le bas de sa façade)
const CHURCH_BASE = VILLAGE_LINES.findIndex((line) => line.includes('|________|'))
// toutes les places (colonne, ligne), de gauche à droite
export const places: [number, number][] = []
export function perches() {
  const { villageCol, villageRow, cols, rows } = grid
  const roofs: [number, number][] = []
  VILLAGE_LINES.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      // l'église : seulement sur son toit et la pointe du clocher (pas sur le bas de sa façade) ; les maisons : sur
      // tous leurs toits, même ceux des rangées du bas
      if (y <= CHURCH_BASE ? y > 0 && !SKY[y - 1][x] : VILLAGE_LINES[y - 1]?.[x] === '_') continue
      // sur un toit (« _ ») : dans la même case, le v posé sur le trait ; sur la pointe du clocher : juste au-dessus
      if (line[x] === '_') roofs.push([villageCol + x, villageRow + y])
      else if (line[x] === '/' || line[x] === '\\') roofs.push([villageCol + x, villageRow + y - 1])
    }
  })
  // le sol : le bas de la page, de la gauche jusqu'au village
  const ground: [number, number][] = []
  const end = villageCol - 2
  for (let col = 1; col < end; col++) ground.push([col, rows - 1])
  // les oiseaux se répartissent sur toutes les places, autant sur chacune ; chacun va vers une place du même côté
  // que lui dans le nuage (de gauche à droite)
  const order = Array.from({ length: COUNT }, (_, i) => i).sort((a, b) => u[a] - u[b])
  places.length = 0
  places.push(...[...ground, ...roofs].sort((a, b) => a[0] - b[0]))
  order.forEach((bird, k) => {
    const place = places[Math.floor((k / COUNT) * places.length)]
    perchCol[bird] = place[0]
    perchRow[bird] = place[1]
  })
  // l'atterrissage par zones : les places sont regroupées en ZONES morceaux, de gauche à droite ; elles se
  // remplissent l'une après l'autre, du village vers l'extérieur (avec un peu de désordre dans l'ordre), et dans
  // chaque zone les oiseaux arrivent étalés sur deux secondes (beaucoup au début, quelques retardataires)
  const villageMid = villageCol + VILLAGE_W / 2
  const zoneOrder = Array.from({ length: ZONES }, (_, z) => z)
    .map((z) => ({ z, d: Math.abs(((z + 0.5) / ZONES) * cols - villageMid) / cols + Math.random() * 0.15 }))
    .sort((a, b) => a.d - b.d)
    .map(({ z }) => z)
  const rank = zoneOrder.map((_, z) => zoneOrder.indexOf(z))
  const step = (LAND_SPREAD - 2) / (ZONES - 1)
  for (let i = 0; i < COUNT; i++) {
    const zone = Math.min(ZONES - 1, Math.floor((perchCol[i] / cols) * ZONES))
    settle[i] = rank[zone] * step + 2 * Math.random() ** 1.6
  }
}
