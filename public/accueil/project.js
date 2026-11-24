// A project's page, as a layer over the home page: the backdrop never reloads, every move stays fluid.
// · home → project: the camera moves into the project's place turning a little (`near`, see relief-shader.js), then
//   drifts slowly there; the screenshot following the cursor (cards.js) grows into the large one;
// · project → project (the links at the bottom, ← →): the place transforms where it stands, the screenshot changes;
// · back home (« tous les projets », « hello, world. », Escape, the back button): the camera pulls out, the place of
//   the last project stays, its card stays active.
// The address follows (?p=id): a project opens directly, and the browser's back button works (see route(), lab.js).
// Uses BACKDROP, aim, activate, cardLink (cards.js), PROJECTS (data.js), calm, smooth, QUERY (header.js).
// On a project page the relief is always whole (on the home page it rises with the scroll).
const aimProject = (id) => ({ ...aim(id), rise: 1 })
const layer = el(`<div class="project-layer"><main class="project"></main><nav class="project-nav mono"></nav></div>`)
document.body.append(layer)
const sheet = layer.querySelector('.project'), projectNav = layer.querySelector('.project-nav')
let openId = null

// moving in: `near` (and the drift, which follows it) glides softly to its target, from wherever it is
let nearFrom = 0, nearTo = 0, nearNow = 0, nearT0 = 0, nearRunning = false
const APPROACH_MS = 1100
function approach(v, instant = false) {
  if (calm || instant) { nearNow = nearTo = v; BACKDROP.set('near', v); BACKDROP.set('drift', calm ? 0 : v); BACKDROP.animate(!calm && v > 0); return }
  nearFrom = nearNow; nearTo = v; nearT0 = performance.now()
  BACKDROP.animate(true)
  if (!nearRunning) { nearRunning = true; requestAnimationFrame(approachStep) }
}
function approachStep() {
  const k = smooth(Math.min(1, (performance.now() - nearT0) / APPROACH_MS))
  nearNow = nearFrom + (nearTo - nearFrom) * k
  BACKDROP.set('near', nearNow)
  BACKDROP.set('drift', nearNow)
  if (k < 1) requestAnimationFrame(approachStep)
  else { nearRunning = false; if (!nearTo) BACKDROP.animate(false) }
}

// a page change within the page: the thumbnail and the screenshot named `capture` turn into each other (if the
// browser can, and less motion was not asked for)
function transition(update) {
  if (!document.startViewTransition || calm) { update(); return Promise.resolve() }
  const t = document.startViewTransition(update)
  t.ready.catch(() => {}); t.updateCallbackDone.catch(() => {})   // a transition can interrupt another: no harm
  return t.finished.catch(() => {})
}

// the screenshots: the large one (the card's thumbnail, grown), and next to it, when there is one, the same project on
// a phone
const shots = (p) => `
    <div class="shots${p.phone ? ' with-phone' : ''}">
      <figure class="capture"><img src="${p.src}" alt="${p.alt || p.title}" style="view-transition-name: capture" /></figure>
      ${p.phone ? `<figure class="phone"><img src="${p.phone.src}" alt="${p.phone.alt}" /></figure>` : ''}
    </div>`

function fill(id, rising) {
  const i = PROJECTS.findIndex((p) => p.id === id), p = PROJECTS[i]
  const prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length]
  sheet.innerHTML = `
    ${shots(p)}
    <section class="caption${rising ? ' rising' : ''}">
      <h1 tabindex="-1">${p.title}</h1>
      <p class="summary">${p.short}</p>
      <p class="facts mono">0${i + 1} / 0${PROJECTS.length}<br />${p.kind}<br />${p.stack}<br />
        ${p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">voir le site →</a>` : '<span>en cours · bientôt en ligne</span>'}
        ${p.code ? ` &nbsp;<a href="${p.code}" target="_blank" rel="noopener">le code →</a>` : ''}</p>
    </section>`
  projectNav.innerHTML = `
    <a href="?">← tous les projets</a>
    <a href="?p=${prev.id}" data-id="${prev.id}">${prev.title}</a>
    <a href="?p=${next.id}" data-id="${next.id}">${next.title} →</a>`
  document.title = `${p.title} — Garance Wetzel`
}
// the links at the bottom: back home, and the neighbouring projects (hovering them already leads to their place)
projectNav.addEventListener('click', (e) => {
  const a = e.target.closest('a')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  a.dataset.id ? openProject(a.dataset.id) : closeProject()
})
projectNav.addEventListener('pointerover', (e) => { const a = e.target.closest('a[data-id]'); if (a) BACKDROP.goTo(aimProject(a.dataset.id)) })
projectNav.addEventListener('pointerout', (e) => { if (e.target.closest('a[data-id]') && openId) BACKDROP.goTo(aimProject(openId)) })

// instant: no transition (arriving directly on ?p=id, or within another transition)
function openProject(id, { history: push = true, instant = false } = {}) {
  if (!PROJECTS.some((p) => p.id === id) || id === openId) return
  const thumb = !openId && thumbFor(id)
  // from one project to another: which way (the next one comes from the right, the previous one from the left)
  const from = PROJECTS.findIndex((p) => p.id === openId), to = PROJECTS.findIndex((p) => p.id === id)
  const way = !openId ? '' : (to - from + PROJECTS.length) % PROJECTS.length === 1 ? 'vt-next' : 'vt-prev'
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
    sheet.querySelector('h1').focus({ preventScroll: true })   // the keyboard carries on from the page, not from the hidden card
  }
  if (instant) { update(); return }
  if (way) document.documentElement.classList.add(way)
  transition(update).then(() => document.documentElement.classList.remove('vt-next', 'vt-prev'))
}

function closeProject({ history: push = true, instant = false } = {}) {
  if (!openId) return
  const id = openId, thumb = null, shot = sheet.querySelector('.capture > *')   // (going back, the screenshot fades: the badges have none)
  BACKDROP.goTo(aim(id))                                // the relief takes back the height the scroll gives it
  if (push) history.pushState({}, '', location.pathname)
  openId = null
  document.title = 'Garance Wetzel'
  approach(0, instant)
  const update = () => {
    if (shot) shot.style.viewTransitionName = ''
    if (thumb && !instant) thumb.style.viewTransitionName = 'capture'
    document.documentElement.classList.remove('project-open')
    cardLink(id)?.focus({ preventScroll: true })
  }
  if (instant) { update(); return }
  document.documentElement.classList.add('vt-back')
  transition(update).then(() => {
    if (thumb) thumb.style.viewTransitionName = ''
    document.documentElement.classList.remove('vt-back')
  })
}

// « hello, world. »: from a project page, it brings the home page back (on the home page, header.js scrolls up)
document.querySelector('.top-bar .home').addEventListener('click', (e) => {
  if (!openId) return
  e.preventDefault()
  e.stopImmediatePropagation()
  closeProject()
}, true)
// Escape closes the page (in the snow globe, Escape comes back first: see snow-globe.js); ← and →: the previous and
// next project (the backdrop glides from one place to the other); held down, the key does not repeat
addEventListener('keydown', (e) => {
  if (!openId || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Escape') closeProject()
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.repeat) {
    const i = PROJECTS.findIndex((p) => p.id === openId), n = PROJECTS.length
    openProject(PROJECTS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id)
  }
})
// a project opened directly (?p=id): we are already there, moved in
if (QUERY.get('p')) openProject(QUERY.get('p'), { history: false, instant: true })
