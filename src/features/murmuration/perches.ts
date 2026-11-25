import { MAX, LAND_SPREAD, ZONES, settle, u } from './flock'
import { VILLAGE_LINES, VILLAGE_W, grid } from './grid'

// ——— Where to land: on the village roofs and the tip of the bell tower, and along the bottom of the page, left
// of the village ———
// each bird's place: its cell in the sky (column, row)
export const perchCol = new Int16Array(MAX)
export const perchRow = new Int16Array(MAX)
// the sky in the village drawing: the spaces reachable from the top by going down or sideways (not the inside of
// the houses, closed by their walls and roof)
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
// the church's last line (the bottom of its facade)
const CHURCH_BASE = VILLAGE_LINES.findIndex((line) => line.includes('|________|'))
// all the places (column, row), from left to right
export const places: [number, number][] = []
export function perches() {
  const { villageCol, villageRow, cols, rows } = grid
  const roofs: [number, number][] = []
  VILLAGE_LINES.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      // the church: only on its roof and the tip of the bell tower (not on the bottom of its facade); the houses: on
      // all their roofs, even those of the lower rows
      if (y <= CHURCH_BASE ? y > 0 && !SKY[y - 1][x] : VILLAGE_LINES[y - 1]?.[x] === '_') continue
      // on a roof (« _ »): in the same cell, the v sitting on the stroke; on the tip of the bell tower: just above
      if (line[x] === '_') roofs.push([villageCol + x, villageRow + y])
      else if (line[x] === '/' || line[x] === '\\') roofs.push([villageCol + x, villageRow + y - 1])
    }
  })
  // the ground: the bottom of the page, from the left up to the village
  const ground: [number, number][] = []
  const end = villageCol - 2
  for (let col = 1; col < end; col++) ground.push([col, rows - 1])
  // the birds spread over all the places, the same number on each; each one heads for a place on the same side as
  // itself in the cloud (from left to right)
  const order = Array.from({ length: MAX }, (_, i) => i).sort((a, b) => u[a] - u[b])
  places.length = 0
  places.push(...[...ground, ...roofs].sort((a, b) => a[0] - b[0]))
  order.forEach((bird, k) => {
    const place = places[Math.floor((k / MAX) * places.length)]
    perchCol[bird] = place[0]
    perchRow[bird] = place[1]
  })
  // landing by areas: the places are grouped into ZONES pieces, from left to right; they fill up one after the
  // other, from the village outwards (with a little disorder in the order), and in each area the birds arrive
  // spread over two seconds (many at first, a few latecomers)
  const villageMid = villageCol + VILLAGE_W / 2
  const zoneOrder = Array.from({ length: ZONES }, (_, z) => z)
    .map((z) => ({ z, d: Math.abs(((z + 0.5) / ZONES) * cols - villageMid) / cols + Math.random() * 0.15 }))
    .sort((a, b) => a.d - b.d)
    .map(({ z }) => z)
  const rank = zoneOrder.map((_, z) => zoneOrder.indexOf(z))
  const step = (LAND_SPREAD - 2) / (ZONES - 1)
  for (let i = 0; i < MAX; i++) {
    const zone = Math.min(ZONES - 1, Math.floor((perchCol[i] / cols) * ZONES))
    settle[i] = rank[zone] * step + 2 * Math.random() ** 1.6
  }
}
