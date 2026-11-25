import { BACKDROP, SETTINGS, hoverAllowed, nameArrived, scrollDriven } from './backdrop'
import { PROJECTS } from './data'
import type { Settings } from './gl-background'
import { openLab } from './lab-gate'
import { hideNote, showNote } from './note'
import { LAB_URL, QUERY, calm, el, modified } from './shared'

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

// the projects: hovering (or a click, a touch) leads to their place and writes their sentence and links (see
// note.ts); then the lab as a last badge (« labo → »: it opens the lab behind a riddle, see lab-gate.ts; it is just a page: hovering
// it shows no screenshot and does not change the place)
export const PROJECTS_MODE: Mode = {
  items: [
    ...PROJECTS.map((p) => ({ id: p.id, title: p.title, src: p.src, href: `?p=${p.id}` })),
    { id: 'labo', title: 'labo →', src: null, href: LAB_URL },
  ],
  signature: 'Garance Wetzel',
  aim,
  open: (id) => (id === 'labo' ? openLab() : pin(id)),
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
  if (!a || a.classList.contains('active') || !hoverAllowed()) return // not before the badges are there
  const id = a.dataset.id!
  if (mode === PROJECTS_MODE && id === 'labo') return // the lab badge has no place
  activate(id)
  BACKDROP.goTo(mode.aim(id))
  if (mode === PROJECTS_MODE) showNote(id)
}
// a project chosen (a click, a touch): its place, its note. Chosen while the badges still rise: the
// page goes on down to them first.
function pin(id: string) {
  if (!hoverAllowed()) scrollTo({ top: document.documentElement.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  activate(id)
  BACKDROP.goTo(aim(id))
  showNote(id)
}
// no project chosen any more (a click on the background, Escape): no badge active, no note, the landscape back to
// where it was before any badge
function release() {
  const active = row.querySelector('a.active')
  if (!active || mode !== PROJECTS_MODE) return
  active.classList.remove('active')
  hideNote()
  BACKDROP.goTo(aim('rest'))
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

export function setupCards() {
  document.body.append(scene)
  // the hint to scroll, on arrival: « projets ↓ », a badge in the blue of the sky (see cards.css); it stays while the
  // Canigou rises (until 60 % of a screen). A click on it scrolls for you, softly, down to the badges
  const hint = el<HTMLButtonElement>('<button class="scroll-hint badge" type="button">projets<span aria-hidden="true">↓</span></button>')
  hint.addEventListener('click', () => scrollTo({ top: document.documentElement.scrollHeight, behavior: calm ? 'auto' : 'smooth' }))
  document.body.append(hint)
  setTimeout(() => document.documentElement.classList.add('hint-on'), 900)
  const scrolled = () => {
    document.documentElement.classList.toggle('scrolled', scrollY > 24)
    document.documentElement.classList.toggle('risen', scrollY > innerHeight * 0.6)
  }
  addEventListener('scroll', scrolled, { passive: true })
  scrolled()
  // the scroll drives the backdrop; « hello, world. » greets on arrival and leads back home from the lab:
  // on the home page, once the name has arrived under the badges, it steps aside (cards.css: html.name-here)
  const follow = () => {
    Object.entries(scrollDriven()).forEach(([k, v]) => BACKDROP.set(k, v))
    const home = !document.documentElement.classList.contains('in-lab')
    document.documentElement.classList.toggle('name-here', home && nameArrived())
    document.documentElement.classList.toggle('badges-here', home && hoverAllowed())
    // the name, rising to its place, passes where the project's note is: the note steps aside meanwhile (note.css)
    const name = scene.querySelector('.signature')!.getBoundingClientRect()
    const note = document.querySelector('.project-note')?.getBoundingClientRect()
    document.documentElement.classList.toggle('name-passing', !!note && !nameArrived() && name.top < note.bottom && name.bottom > note.top)
  }
  addEventListener('scroll', follow, { passive: true })
  follow()
  addEventListener('scroll', () => {
    if (!warmed) warm()
  }, { passive: true, once: true })

  // with a finger (no hover): a touch is a click (the badge's place, its note and links); its focus must not count
  // as a hover first
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
    mode.open(a.dataset.id!)
  })

  // a click anywhere but on a badge, the note, or a link or button of the page lets the chosen project go
  addEventListener('click', (e) => {
    if (!(e.target as Element).closest?.('a, button, input, .project-note, .lab-gate')) release()
  })
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') release()
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
    if (!a || e.pointerType !== 'mouse' || !hoverAllowed() || !a.dataset.shot) return // not before the badges are there; not for the lab
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
  // an old link to a project's page (?p=id): the home page, scrolled down to the badges, this project chosen
  const asked = QUERY.get('p')
  if (asked && PROJECTS.some((p) => p.id === asked)) {
    history.replaceState({}, '', location.pathname)
    scrollTo(0, document.documentElement.scrollHeight)
    pin(asked)
  }
}
