import './games.css'
import { mount } from '@/features/carnet/carnet'
import { GAMES } from './data'
import { bestOrder } from './pack'

// Jeux: the games of Garance's childhood, a mosaic of their screenshots on black, by year. Hovering a
// game (or focusing it, or touching it) shows its second screenshot, its title and its year; a game with more
// screenshots shows them one after the other. The visible text is in French.

// the notebook's line (the lab, the page number, the neighbours)
mount()

const grid = document.querySelector<HTMLElement>('.games-grid')!

// the first cell: what these are, and when (the years of the first and the last game)
const years = GAMES.map((g) => g.year)
const intro = document.createElement('li')
intro.className = 'games-intro'
intro.setAttribute('aria-hidden', 'true')
intro.innerHTML = '<p></p>'
intro.querySelector('p')!.textContent = `Jeux sur ordinateur de ${Math.min(...years)} à ${Math.max(...years)}`
grid.append(intro)

// a game with several screenshots: on hover or focus, they follow one another (from the second), and the first comes
// back on leaving; a touch (or Enter) goes to the next one
function cycle(button: HTMLButtonElement) {
  const layers = () => [...button.querySelectorAll<HTMLImageElement>('.game-x')]
  let at = -1, timer = 0
  const go = (i: number) => {
    const all = layers()
    at = i >= all.length ? -1 : i
    all.forEach((img, k) => img.classList.toggle('on', k === at))
    button.setAttribute('aria-pressed', String(at >= 0))
  }
  const start = () => { if (!timer) { go(0); timer = window.setInterval(() => go((at + 1) % layers().length), 1100) } }
  const stop = () => { clearInterval(timer); timer = 0; go(-1) }
  button.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') start() })
  button.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') stop() })
  button.addEventListener('blur', stop)
  button.addEventListener('click', (e) => { e.stopPropagation(); if (!timer) go(at + 1) })
}
for (const game of GAMES) {
  const li = document.createElement('li')
  if (game.big) li.className = 'big'
  // a button: it can be reached with the keyboard, and a touch shows the game as hovering does (a second one hides it)
  li.innerHTML = `<button class="game" type="button" aria-pressed="false">
    <img class="game-a" alt="" loading="lazy" decoding="async" width="480" height="360" />
    ${game.single ? '' : '<img class="game-b" alt="" loading="lazy" decoding="async" width="480" height="360" />'}
    <span class="game-name"><span></span> <span class="game-year"></span></span>
  </button>`
  const [a, b] = li.querySelectorAll('img')
  // (a big one: its screenshots at their full size)
  const size = game.big ? '-big' : ''
  a.src = `/games/${game.slug}${size}.webp`
  if (b) b.src = `/games/${game.slug}-2${size}.webp`
  // more screenshots: layers above the first, shown one after the other (see cycle, below)
  for (let n = 3; n <= (game.more ?? 0); n++) {
    const img = Object.assign(document.createElement('img'), { className: 'game-x', alt: '', loading: 'lazy', decoding: 'async', width: 480, height: 360 })
    img.src = `/games/${game.slug}-${n}${size}.webp`
    li.querySelector('.game-name')!.before(img)
  }
  if (game.more) {
    b?.classList.replace('game-b', 'game-x')
    cycle(li.querySelector('button')!)
  }
  const [title, year] = li.querySelectorAll<HTMLElement>('.game-name > span')
  title.textContent = game.title
  year.textContent = String(game.year)
  grid.append(li)
}

// a touch (or Enter, Space) shows a game; another one, or a touch elsewhere, puts it back
let shown: HTMLButtonElement | null = null
const show = (button: HTMLButtonElement | null) => {
  shown?.setAttribute('aria-pressed', 'false')
  shown = button === shown ? null : button
  shown?.setAttribute('aria-pressed', 'true')
}
grid.addEventListener('click', (e) => show((e.target as Element).closest<HTMLButtonElement>('.game')))
addEventListener('click', (e) => { if (!grid.contains(e.target as Node)) show(null) })

// the end of the mosaic, square: the big games move a few places so that the grid leaves no empty cell (pack.ts); if
// some are still left at the end (at a width where no order closes it), the small games of the last row share them,
// a little wider. Again when the number of columns changes.
const items = [...grid.children] as HTMLElement[]
let laidOut = 0
function closeMosaic() {
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  if (cols === laidOut) return
  laidOut = cols
  // (the first cell stays first: nothing moves before it)
  const { order } = bestOrder([{ big: false }, ...GAMES.map((g) => ({ big: !!g.big }))], cols, 3, 1)
  order.forEach((game, at) => { items[game].style.order = String(at) })
  items.forEach((li) => li.style.removeProperty('grid-column'))
  const box = grid.getBoundingClientRect()
  const cell = box.width / cols
  const rects = items.map((li) => li.getBoundingClientRect())
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const last = items.filter((_, i) => rects[i].bottom > bottom - cell * 0.375)
  const missing = Math.round((box.width - last.reduce((sum, li) => sum + li.getBoundingClientRect().width, 0)) / cell)
  if (!missing || last.some((li) => li.classList.contains('big'))) return
  const row = last.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
  const spans = row.map(() => 1)
  for (let k = 0; k < missing; k++) spans[row.length - 1 - (k % row.length)]++
  row.forEach((li, i) => { li.style.gridColumn = `span ${spans[i]}` })
}
closeMosaic()
addEventListener('resize', closeMosaic)
