import { sheet as page } from '@/features/carnet/sheet'
import { VILLAGE } from './village'

// Le ciel est une grille de caractères (voir main.ts) : la taille d'une case, le nombre de cases, et où est le
// village sur la même grille. Recalculé à chaque changement de taille de la fenêtre (le ciel, c'est la feuille du
// carnet : voir carnet/sheet.ts).

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
  // combien d'oiseaux en vol, et combien de posés, dans chaque case
  density: new Float32Array(0),
  perched: new Uint16Array(0),
}

// la taille d'une case : la largeur d'un caractère et la hauteur d'une ligne du ciel
export function resize() {
  const { w, h } = page()
  // la taille des caractères : 12 px, ou moins sur un écran étroit (téléphone), pour que le village tienne en
  // entier dans la largeur (un caractère de JetBrains Mono fait 0,6 fois sa taille de large)
  const size = Math.max(5, Math.min(12, Math.floor((w - 16) / (VILLAGE_W + 2) / 0.6)))
  document.documentElement.style.setProperty('--mm-size', `${size}px`)
  const probe = document.createElement('span')
  probe.textContent = 'M'.repeat(100)
  sky.append(probe)
  grid.cellW = probe.getBoundingClientRect().width / 100
  probe.remove()
  grid.cellH = parseFloat(getComputedStyle(sky).lineHeight)
  grid.cols = Math.floor(w / grid.cellW)
  // (la dernière ligne du ciel touche le bas de la page ; la première est un peu coupée en haut)
  grid.rows = Math.ceil(h / grid.cellH)
  grid.skyTop = h - grid.rows * grid.cellH
  sky.style.top = `${grid.skyTop}px`
  grid.density = new Float32Array(grid.cols * grid.rows)
  grid.perched = new Uint16Array(grid.cols * grid.rows)
  // le village, sur la même grille que le ciel, en bas à droite (pour que les oiseaux se posent pile sur les toits)
  grid.villageCol = Math.max(
    0,
    grid.cols - VILLAGE_W - Math.round(Math.min(32, Math.max(8, w * 0.024)) / grid.cellW),
  )
  grid.villageRow = grid.rows - VILLAGE_LINES.length
  village.style.left = `${grid.villageCol * grid.cellW}px`
  village.style.top = `${grid.skyTop + grid.villageRow * grid.cellH}px`
}
