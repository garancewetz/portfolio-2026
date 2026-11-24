import { BACKDROP, SETTINGS, hoverAllowed, scrollDriven } from './backdrop'
import { PROJECTS } from './data'
import type { Settings } from './gl-background'
import { openLab } from './lab-gate'
import { openProject } from './project'
import { LAB_URL, el, modified } from './shared'

// The page of badges (see cards.css): the row of badges (six projects and the lab, or five experiments) rising in a
// wave and sticking to the top, the signature arriving after them. It shows in turn the projects (home) or the
// experiments (the lab, see lab.ts): a "mode" = { items, signature, aim(id): the backdrop's settings, open(id) }.

export type Mode = {
  items: { id: string; title: string; src: string | null; href: string }[]
  signature: string
  aim: (id: string) => Settings
  open: (id: string) => void
}

export const scene = el(`
  <div class="scene">
    <nav class="row"></nav>
    <div class="signature-rail"><footer class="signature"><span class="name">Garance Wetzel</span></footer></div>
  </div>`)
const row = scene.querySelector<HTMLElement>('.row')!

export const aim = (id: string): Settings => ({ ...SETTINGS[id], ...scrollDriven() })

// the projects: hovering leads to their place, clicking opens their page (in the page itself, see project.ts); then
// the lab as a last badge (« labo → »: it opens the lab behind a riddle, see lab-gate.ts; it is just a page: hovering
// it shows no screenshot and does not change the place)
export const PROJECTS_MODE: Mode = {
  items: [
    ...PROJECTS.map((p) => ({ id: p.id, title: p.title, src: p.src, href: `?p=${p.id}` })),
    { id: 'labo', title: 'labo →', src: null, href: LAB_URL },
  ],
  signature: 'Garance Wetzel',
  aim,
  open: (id) => (id === 'labo' ? openLab() : openProject(id)),
}
let mode = PROJECTS_MODE

// lay out a mode's badges (the grid stays: the wave does not move); a badge's screenshot is not in the page, only its
// address (data-shot): the cursor's image shows it (below)
export function layCards(m: Mode) {
  mode = m
  row.innerHTML = m.items
    .map(
      (it, i) => `
    <div class="col">
      <a href="${it.href}" data-id="${it.id}"${it.src ? ` data-shot="${it.src}"` : ''} style="--i:${i}; view-transition-name: card-${i}">
        <b>${it.title}</b>
      </a>
    </div>`,
    )
    .join('')
  scene.querySelector('.signature .name')!.textContent = m.signature
  if (warmed || m !== PROJECTS_MODE) warm()
}
// the screenshots, loaded ahead of the first hover: on the home page at the first scroll (not on arrival: the
// landscape first), in the lab at once
let warmed = false
function warm() {
  warmed = true
  row.querySelectorAll<HTMLElement>('a[data-shot]').forEach((a) => {
    new Image().src = a.dataset.shot!
  })
}

export const cardLink = (id: string) => row.querySelector<HTMLAnchorElement>(`a[data-id="${id}"]`)
// the last hovered badge stays active: its place does not leave when the pointer leaves it
export function activate(id: string) {
  row.querySelector('a.active')?.classList.remove('active')
  cardLink(id)?.classList.add('active')
}
const linkOf = (e: Event) => (e.target as Element).closest<HTMLAnchorElement>('a')
function hover(a: HTMLAnchorElement | null) {
  if (!a || a.classList.contains('active') || !hoverAllowed()) return // not while the badges rise
  const id = a.dataset.id!
  if (mode === PROJECTS_MODE && id === 'labo') return // the lab badge has no place
  activate(id)
  BACKDROP.goTo(mode.aim(id))
}

// with a mouse: the hovered project's screenshot follows the cursor, a little below and to the right of it (to the
// left near the right edge), gliding softly behind it
const cursorShot = el('<figure class="cursor-shot" aria-hidden="true"><img alt="" /></figure>')
const cursorImage = cursorShot.querySelector('img')!
let mouse = { x: 0, y: 0 }
let shown = { x: 0, y: 0 }
let gliding = false
function glide() {
  shown.x += (mouse.x - shown.x) * 0.22
  shown.y += (mouse.y - shown.y) * 0.22
  const w = cursorShot.offsetWidth
  const h = cursorShot.offsetHeight
  const x = shown.x + 24 + w > innerWidth - 12 ? shown.x - 24 - w : shown.x + 24
  const y = Math.min(innerHeight - h - 12, shown.y + 24)
  cursorShot.style.translate = `${x}px ${y}px`
  gliding = Math.abs(mouse.x - shown.x) + Math.abs(mouse.y - shown.y) > 0.5
  if (gliding) requestAnimationFrame(glide)
}
// the image a project's page grows from (project.ts): the screenshot following the cursor, if it shows this project
export const thumbFor = (id: string) => (cursorShot.classList.contains('on') && cursorShot.dataset.id === id ? cursorImage : null)

export function setupCards() {
  document.body.append(scene)
  // the hint to scroll, on arrival: a badge (see cards.css); gone at the first scroll
  document.body.append(el('<p class="scroll-hint badge" aria-hidden="true">défiler<span>↓</span></p>'))
  setTimeout(() => document.documentElement.classList.add('hint-on'), 2000)
  const scrolled = () => document.documentElement.classList.toggle('scrolled', scrollY > 24)
  addEventListener('scroll', scrolled, { passive: true })
  scrolled()
  // the scroll drives the backdrop; « hello, world. » greets on arrival and leads back home from a project or the lab:
  // on the home page, once the name has arrived under the badges, it steps aside (cards.css: html.name-here)
  const follow = () => {
    Object.entries(scrollDriven()).forEach(([k, v]) => BACKDROP.set(k, v))
    document.documentElement.classList.toggle('name-here', !document.documentElement.classList.contains('in-lab') && hoverAllowed())
  }
  addEventListener('scroll', follow, { passive: true })
  follow()
  addEventListener('scroll', () => {
    if (!warmed) warm()
  }, { passive: true, once: true })

  // with a finger (no hover): a first touch leads to the badge's place, a second one opens it
  let lastTouch = 0
  const touchedRecently = () => performance.now() - lastTouch < 800
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') lastTouch = performance.now()
  })
  row.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'touch') hover(linkOf(e))
  })
  // with the keyboard too: Tab changes the place
  row.addEventListener('focusin', (e) => {
    if (!touchedRecently()) hover(linkOf(e))
  })
  row.addEventListener('click', (e) => {
    const a = linkOf(e)
    if (!a || modified(e)) return
    e.preventDefault()
    if (touchedRecently() && hoverAllowed() && !a.classList.contains('active') && a.dataset.id !== 'labo') {
      hover(a)
      return
    }
    mode.open(a.dataset.id!)
  })

  document.body.append(cursorShot)
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      mouse = { x: e.clientX, y: e.clientY }
      if (!cursorShot.classList.contains('on')) shown = { ...mouse }
      if (!gliding) {
        gliding = true
        requestAnimationFrame(glide)
      }
    },
    { passive: true },
  )
  row.addEventListener('pointerover', (e) => {
    const a = linkOf(e)
    if (!a || e.pointerType !== 'mouse' || !hoverAllowed() || !a.dataset.shot) return // not while the badges rise; not for the lab
    cursorImage.src = a.dataset.shot
    cursorShot.dataset.id = a.dataset.id
    cursorShot.classList.add('on')
  })
  row.addEventListener('pointerout', (e) => {
    const to = e.relatedTarget as Element | null
    if (linkOf(e) && !to?.closest?.('.row a')) cursorShot.classList.remove('on')
  })
  addEventListener('scroll', () => cursorShot.classList.remove('on'), { passive: true })
  layCards(PROJECTS_MODE)
}
