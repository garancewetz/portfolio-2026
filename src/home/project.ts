import { BACKDROP } from './backdrop'
import { activate, aim, cardLink, thumbFor } from './cards'
import { PROJECTS, type Project } from './data'
import { homeLink } from './header'
import { QUERY, calm, el, modified, smooth } from './shared'

// A project's page, as a layer over the home page: the backdrop never reloads, every move stays fluid.
// · home → project: the camera moves into the project's place turning a little (`near`, see relief-shader.ts), then
//   drifts slowly there; the screenshot following the cursor (cards.ts) grows into the large one;
// · project → project (the links at the bottom, ← →): the place transforms where it stands, the screenshot changes;
// · back home (« tous les projets », « hello, world. », Escape, the back button): the camera pulls out, the place of
//   the last project stays, its badge stays active.
// The address follows (?p=id): a project opens directly, and the browser's back button works (see route(), lab.ts).

// on a project page the relief is always whole (on the home page it rises with the scroll)
const aimProject = (id: string) => ({ ...aim(id), rise: 1 })
const layer = el(`<div class="project-layer"><main class="project"></main><nav class="project-nav mono"></nav></div>`)
const sheet = layer.querySelector<HTMLElement>('.project')!
const projectNav = layer.querySelector<HTMLElement>('.project-nav')!
let openId: string | null = null
const indexOf = (id: string | null) => PROJECTS.findIndex((p) => p.id === id)

// moving in: `near` (and the drift, which follows it) glides softly to its target, from wherever it is
let nearFrom = 0
let nearTo = 0
let nearNow = 0
let nearT0 = 0
let nearRunning = false
const APPROACH_MS = 1100
export function approach(v: number, instant = false) {
  if (calm || instant) {
    nearNow = nearTo = v
    BACKDROP.set('near', v)
    BACKDROP.set('drift', calm ? 0 : v)
    BACKDROP.animate(!calm && v > 0)
    return
  }
  nearFrom = nearNow
  nearTo = v
  nearT0 = performance.now()
  BACKDROP.animate(true)
  if (!nearRunning) {
    nearRunning = true
    requestAnimationFrame(approachStep)
  }
}
function approachStep() {
  const k = smooth(Math.min(1, (performance.now() - nearT0) / APPROACH_MS))
  nearNow = nearFrom + (nearTo - nearFrom) * k
  BACKDROP.set('near', nearNow)
  BACKDROP.set('drift', nearNow)
  if (k < 1) requestAnimationFrame(approachStep)
  else {
    nearRunning = false
    if (!nearTo) BACKDROP.animate(false)
  }
}

// a page change within the page: the images named `capture` turn into each other (if the browser can, and less
// motion was not asked for)
export function transition(update: () => void): Promise<void> {
  if (!document.startViewTransition || calm) {
    update()
    return Promise.resolve()
  }
  const t = document.startViewTransition(update)
  // (a transition can interrupt another: no harm)
  t.ready.catch(() => {})
  t.updateCallbackDone.catch(() => {})
  return t.finished.catch(() => {})
}

// the screenshots: the large one, and next to it, when there is one, the same project on a phone
const shots = (p: Project) => `
    <div class="shots${p.phone ? ' with-phone' : ''}">
      <figure class="capture"><img src="${p.src}" alt="${p.alt || p.title}" style="view-transition-name: capture" /></figure>
      ${p.phone ? `<figure class="phone"><img src="${p.phone.src}" alt="${p.phone.alt}" /></figure>` : ''}
    </div>`

function fill(id: string, rising: boolean) {
  const i = indexOf(id)
  const p = PROJECTS[i]
  const n = PROJECTS.length
  const prev = PROJECTS[(i + n - 1) % n]
  const next = PROJECTS[(i + 1) % n]
  sheet.innerHTML = `
    ${shots(p)}
    <section class="caption${rising ? ' rising' : ''}">
      <h1 tabindex="-1">${p.title}</h1>
      <p class="summary">${p.short}</p>
      <p class="facts mono">0${i + 1} / 0${n}<br />${p.kind}<br />${p.stack}<br />
        ${p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">voir le site →</a>` : '<span>en cours · bientôt en ligne</span>'}
        ${p.code ? ` &nbsp;<a href="${p.code}" target="_blank" rel="noopener">le code →</a>` : ''}</p>
    </section>`
  projectNav.innerHTML = `
    <a href="?">← tous les projets</a>
    <a href="?p=${prev.id}" data-id="${prev.id}">${prev.title}</a>
    <a href="?p=${next.id}" data-id="${next.id}">${next.title} →</a>`
  document.title = `${p.title} — Garance Wetzel`
}

// instant: no transition (arriving directly on ?p=id, or within another transition)
export function openProject(id: string, { history: push = true, instant = false } = {}) {
  if (indexOf(id) < 0 || id === openId) return
  const thumb = !openId && thumbFor(id)
  // from one project to another: which way (the next one comes from the right, the previous one from the left)
  const n = PROJECTS.length
  const way = !openId ? '' : (indexOf(id) - indexOf(openId) + n) % n === 1 ? 'vt-next' : 'vt-prev'
  if (thumb) thumb.style.viewTransitionName = 'capture'
  if (instant) BACKDROP.set('rise', 1)
  BACKDROP.goTo(aimProject(id))
  activate(id)
  if (push) history.pushState({ p: id }, '', `?p=${id}`)
  openId = id
  approach(1, instant)
  const update = () => {
    if (thumb) thumb.style.viewTransitionName = ''
    fill(id, !way)
    document.documentElement.classList.add('project-open')
    layer.scrollTop = 0
    sheet.querySelector('h1')!.focus({ preventScroll: true }) // the keyboard carries on from the page
  }
  if (instant) {
    update()
    return
  }
  if (way) document.documentElement.classList.add(way)
  transition(update).then(() => document.documentElement.classList.remove('vt-next', 'vt-prev'))
}

// going back, the screenshot fades (the badges have none to grow back into)
export function closeProject({ history: push = true, instant = false } = {}) {
  if (!openId) return
  const id = openId
  const shot = sheet.querySelector<HTMLElement>('.capture > *')
  BACKDROP.goTo(aim(id)) // the relief takes back the height the scroll gives it
  if (push) history.pushState({}, '', location.pathname)
  openId = null
  document.title = 'Garance Wetzel'
  approach(0, instant)
  const update = () => {
    if (shot) shot.style.viewTransitionName = ''
    document.documentElement.classList.remove('project-open')
    cardLink(id)?.focus({ preventScroll: true })
  }
  if (instant) {
    update()
    return
  }
  document.documentElement.classList.add('vt-back')
  transition(update).then(() => document.documentElement.classList.remove('vt-back'))
}

export function setupProject() {
  document.body.append(layer)
  // the links at the bottom: back home, and the neighbouring projects (hovering them already leads to their place)
  const linkOf = (e: Event) => (e.target as Element).closest<HTMLAnchorElement>('a[data-id]')
  projectNav.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a')
    if (!a || modified(e)) return
    e.preventDefault()
    if (a.dataset.id) openProject(a.dataset.id)
    else closeProject()
  })
  projectNav.addEventListener('pointerover', (e) => {
    const a = linkOf(e)
    if (a) BACKDROP.goTo(aimProject(a.dataset.id!))
  })
  projectNav.addEventListener('pointerout', (e) => {
    if (linkOf(e) && openId) BACKDROP.goTo(aimProject(openId))
  })
  // « hello, world. »: from a project page, it brings the home page back (on the home page, header.ts scrolls up)
  homeLink().addEventListener(
    'click',
    (e) => {
      if (!openId) return
      e.preventDefault()
      e.stopImmediatePropagation()
      closeProject()
    },
    true,
  )
  // Escape closes the page (in the snow globe, Escape comes back first: see snow-globe.ts); ← and →: the previous and
  // next project (the backdrop glides from one place to the other); held down, the key does not repeat
  addEventListener('keydown', (e) => {
    if (!openId || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') closeProject()
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.repeat) {
      const n = PROJECTS.length
      openProject(PROJECTS[(indexOf(openId) + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id)
    }
  })
  // a project opened directly (?p=id): we are already there, moved in
  const id = QUERY.get('p')
  if (id) openProject(id, { history: false, instant: true })
}
