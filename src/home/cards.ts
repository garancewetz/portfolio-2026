import { BACKDROP, SETTINGS, hoverAllowed, lead, scrollDriven } from './backdrop'
import { PROJECTS } from './data'
import type { Settings } from './gl-background'
import { enterLab } from './lab'
import { hideNote, showNote } from './note'
import { LAB_URL, QUERY, calm, el, modified } from './shared'

// The page of badges (see cards.css): the projects and the lab, at the top from the start, stuck there while the
// scroll raises the Canigou.

export const scene = el(`
  <div class="scene">
    <h1 class="sr">Garance Wetzel, développeuse front-end : ses projets</h1>
    <nav class="row" aria-label="Projets"></nav>
  </div>`)
const row = scene.querySelector<HTMLElement>('.row')!

export const aim = (id: string): Settings => ({ ...SETTINGS[id], ...scrollDriven() })

// the projects: hovering (or a click, a touch) leads to their place and writes their sentence and links (see
// note.ts); then the lab as a last badge (« labo → »: it opens the lab, see lab.ts; it is just a page: hovering
// it shows no screenshot and does not change the place)
const ITEMS: { id: string; title: string; src: string | null; href: string }[] = [
  // (with a mouse, a click goes to the project itself: its site, else its code; its address is the badge's link)
  ...PROJECTS.map((p) => ({ id: p.id, title: p.title, src: p.src, href: p.demo ?? p.code ?? `?p=${p.id}` })),
  { id: 'labo', title: 'labo →', src: null, href: LAB_URL },
]
// a badge chosen (a click, a touch, Enter): the lab opens, a project is pinned
const open = (id: string) => (id === 'labo' ? enterLab() : pin(id))

// lay out the badges; a badge's screenshot is not in the page, only its address (data-shot): the cursor's image shows
// it (below)
function layCards() {
  row.innerHTML = ITEMS
    .map(
      (it, i) => `
    <div class="col">
      <a href="${it.href}" data-id="${it.id}"${it.src ? ` data-shot="${it.src}"` : ''} style="--i:${i}; view-transition-name: card-${i}">
        <b>${it.title}${it.href.startsWith('http') ? '<span class="sr"> (nouvel onglet)</span>' : ''}</b>
      </a>
    </div>`,
    )
    .join('')
}
// the screenshots, loaded ahead of the first hover, at the first scroll (not on arrival: the landscape first)
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
  if (id === 'labo') return // the lab badge has no place
  activate(id)
  BACKDROP.goTo(aim(id))
  showNote(id)
}
// a project chosen (a click, a touch): its place, its note. Chosen while the badges still rise: the
// page goes on down to them first.
function pin(id: string) {
  if (!hoverAllowed()) scrollTo({ top: document.documentElement.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  activate(id)
  BACKDROP.goTo(aim(id))
  showNote(id)
}
// leaving for a page of this site (Kit's): the home page notes where it was, so that coming back, by its link or the
// back button, finds it ready, this project chosen, never the arrival in the clouds
export const leaveFor = (id: string) => history.replaceState({}, '', `?p=${id}`)

// no project chosen any more (a click on the background, Escape): no badge active, no note, the landscape back to
// where it was before any badge
function release() {
  const active = row.querySelector('a.active')
  if (!active) return
  active.classList.remove('active')
  hideNote()
  BACKDROP.goTo(aim('rest'))
}

// with a mouse: the hovered project's screenshot follows the cursor, a little below and to the right of it (to the
// left near the right edge), gliding softly behind it
// (its sentence under it: what it is, and what it does; the note of note.ts stays for a finger and the keyboard)
const cursorShot = el('<figure class="cursor-shot" aria-hidden="true"><img alt="" /><figcaption><b class="mono"></b><span></span></figcaption></figure>')
const cursorImage = cursorShot.querySelector('img')!
const cursorKind = cursorShot.querySelector('b')!
const cursorShort = cursorShot.querySelector('span')!
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
  // the badges' arrival (cards.css) plays once: not again when the lab gives the page back
  setTimeout(() => document.documentElement.classList.add('arrived'), 2500)
  // on arrival, the sign that the page goes on below, with no word: three dots, one under the other, lighting up one
  // after the other downwards, at the bottom centre (cards.css); a click on it scrolls; gone at the first scroll
  const cue = el('<button class="scroll-cue" type="button" aria-label="Défiler"><i></i><i></i><i></i></button>')
  cue.addEventListener('click', () => scrollTo({ top: lead(), behavior: calm ? 'auto' : 'smooth' }))
  document.body.append(cue)
  const scrolled = () => document.documentElement.classList.toggle('scrolled', scrollY > 24)
  addEventListener('scroll', scrolled, { passive: true })
  scrolled()
  // the scroll drives the backdrop, and tells when the badges are on the screen (their note can show, note.css)
  const follow = () => {
    Object.entries(scrollDriven()).forEach(([k, v]) => BACKDROP.set(k, v))
    const home = !document.documentElement.classList.contains('in-lab')
    document.documentElement.classList.toggle('badges-here', home && hoverAllowed())
    // the badges appear one by one with the first stretch of scrolling, each one whole (never half there: cards.css)
    const seen = scrollY / lead()
    row.querySelectorAll('a').forEach((a, i) => a.classList.toggle('shown', seen > 0.02 + i * 0.07))
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
  // a click: with a mouse (the note already showed on hover), it goes to the project, its site or else its code (a
  // page of this site here, another site in a new tab); with a finger, it chooses the project (its place, its note)
  row.addEventListener('click', (e) => {
    const a = linkOf(e)
    if (!a || modified(e)) return
    e.preventDefault()
    const project = PROJECTS.find((p) => p.id === a.dataset.id)
    const target = project && (project.demo ?? project.code)
    // (a pointer's click, not the keyboard's Enter: with the keyboard, Enter chooses it, and its note gives the links)
    if (target && e.detail > 0 && !touchedRecently()) {
      if (target.startsWith('/')) {
        leaveFor(project.id)
        location.href = target
      } else window.open(target, '_blank', 'noopener')
      return
    }
    open(a.dataset.id!)
  })

  // a click anywhere but on a badge, the note, or a link or button of the page lets the chosen project go
  addEventListener('click', (e) => {
    if (!(e.target as Element).closest?.('a, button, input, .project-note')) release()
  })
  addEventListener('keydown', (e) => {
    document.documentElement.classList.remove('by-mouse')
    if (e.key === 'Escape') release()
  })

  document.body.append(cursorShot)
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      document.documentElement.classList.add('by-mouse')
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
    const project = PROJECTS.find((p) => p.id === a.dataset.id)
    cursorKind.textContent = project?.kind ?? ''
    cursorShort.textContent = project?.short ?? ''
    // (a project not yet online to see: its screenshot in grey)
    cursorShot.classList.toggle('unseen', !project?.demo)
    cursorShot.classList.add('on')
  })
  row.addEventListener('pointerout', (e) => {
    const to = e.relatedTarget as Element | null
    if (linkOf(e) && !to?.closest?.('.row a')) cursorShot.classList.remove('on')
  })
  addEventListener('scroll', () => cursorShot.classList.remove('on'), { passive: true })
  layCards()
  // back on the page (the back button: the browser may give it back as it was, or put the scroll back itself, with
  // no scroll event): the page looks again where it is
  addEventListener('pageshow', (e) => {
    if (e.persisted && QUERY.has('p')) history.replaceState({}, '', location.pathname)
    scrolled()
    follow()
  })
  // ?p=id (back from a project's page, or an old link to it): the home page, scrolled down to the badges, this project
  // chosen; the page may already be down there (the browser keeps the scroll): no scroll event, so it is told
  const asked = QUERY.get('p')
  if (asked && PROJECTS.some((p) => p.id === asked)) {
    history.replaceState({}, '', location.pathname)
    scrollTo(0, document.documentElement.scrollHeight)
    scrolled()
    follow()
    pin(asked)
  }
}
