import { sheet as page } from '@/features/carnet/sheet'
import { VILLAGE } from './village'

// The sky is a grid of characters (see main.ts): the size of a cell, the number of cells, and where the village
// is on the same grid. Recomputed on every window resize (the sky is the notebook sheet: see carnet/sheet.ts).

export const sky = document.querySelector<HTMLDivElement>('.mm-sky')!
const village = document.querySelector<HTMLPreElement>('.mm-village')!
village.textContent = VILLAGE

export const VILLAGE_LINES = VILLAGE.split('\n')
export const VILLAGE_W = Math.max(...VILLAGE_LINES.map((line) => line.length))

export const grid = {
  cellW: 7,
  cellH: 12,
  skyTop: 0,
  villageCol: 0,
  villageRow: 0,
  cols: 0,
  rows: 0,
  // how many birds flying, and how many perched, in each cell
  density: new Float32Array(0),
  perched: new Uint16Array(0),
}

// the size of a cell: the width of a character and the height of a line of sky
export function resize() {
  const { w, h } = page()
  // the character size: 12 px, or less on a narrow screen (phone), so the whole village fits in the width (a
  // JetBrains Mono character is 0.6 times its size wide)
  const size = Math.max(5, Math.min(12, Math.floor((w - 16) / (VILLAGE_W + 2) / 0.6)))
  document.documentElement.style.setProperty('--mm-size', `${size}px`)
  const probe = document.createElement('span')
  probe.textContent = 'M'.repeat(100)
  sky.append(probe)
  grid.cellW = probe.getBoundingClientRect().width / 100
  probe.remove()
  grid.cellH = parseFloat(getComputedStyle(sky).lineHeight)
  grid.cols = Math.floor(w / grid.cellW)
  // (the last line of sky touches the bottom of the page; the first one is slightly cut at the top)
  grid.rows = Math.ceil(h / grid.cellH)
  grid.skyTop = h - grid.rows * grid.cellH
  sky.style.top = `${grid.skyTop}px`
  grid.density = new Float32Array(grid.cols * grid.rows)
  grid.perched = new Uint16Array(grid.cols * grid.rows)
  // the village, on the same grid as the sky, at the bottom right (so the birds land right on the roofs)
  grid.villageCol = Math.max(
    0,
    grid.cols - VILLAGE_W - Math.round(Math.min(32, Math.max(8, w * 0.024)) / grid.cellW),
  )
  grid.villageRow = grid.rows - VILLAGE_LINES.length
  village.style.left = `${grid.villageCol * grid.cellW}px`
  village.style.top = `${grid.skyTop + grid.villageRow * grid.cellH}px`
}
