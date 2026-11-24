// The page of badges (see cards.css): the row of badges (six projects and the lab, or five experiments) rising in a
// wave and sticking to the top, the signature arriving after them. It shows in turn the projects (home) or the experiments (the lab, see
// lab.js): a "mode" = { items, signature, aim(id): the backdrop's settings, open(id): on click }.
// The page (index.html) defines before this script BACKDROP (the engine, see gl-background.js), SETTINGS ('rest' and
// one per project), SCROLL_DRIVEN (settings following the scroll, { name: () => value }; they stay as they are while
// hovering) and hoverAllowed() (false while hovering must not change anything).
const scene = el(`
  <div class="scene">
    <nav class="row"></nav>
    <div class="signature-rail"><footer class="signature"><span class="name">Garance Wetzel</span></footer></div>
  </div>`)
document.body.append(scene)
// the hint to scroll, on arrival: a badge (see cards.css); gone at the first scroll
document.body.append(el('<p class="scroll-hint badge" aria-hidden="true">défiler<span>↓</span></p>'))
setTimeout(() => document.documentElement.classList.add('hint-on'), 2000)
const scrolled = () => document.documentElement.classList.toggle('scrolled', scrollY > 24)
addEventListener('scroll', scrolled, { passive: true })
scrolled()
const row = scene.querySelector('.row')
const scrollDriven = () => Object.fromEntries(Object.entries(SCROLL_DRIVEN).map(([k, f]) => [k, f()]))
const aim = (id) => ({ ...SETTINGS[id], ...scrollDriven() })
// « hello, world. » greets on arrival and leads back home from a project or the lab; on the home page, once the name
// has arrived under the badges, it steps aside (cards.css: html.name-here)
const nameHere = () => document.documentElement.classList.toggle('name-here', !document.documentElement.classList.contains('in-lab') && hoverAllowed())
const follow = () => { Object.entries(scrollDriven()).forEach(([k, v]) => BACKDROP.set(k, v)); nameHere() }
addEventListener('scroll', follow, { passive: true })
follow()

// the projects: hovering leads to their place, clicking opens their page (in the page itself, see project.js); then
// the lab as a last badge (« labo → »: it opens the lab behind a riddle, see lab-gate.js; it is just a page: hovering it
// shows no screenshot and does not change the place)
const PROJECTS_MODE = {
  items: [...PROJECTS.map((p) => ({ id: p.id, title: p.title, src: p.src, href: `?p=${p.id}` })),
    { id: 'labo', title: 'labo →', src: null, href: LAB_URL }],
  signature: 'Garance Wetzel',
  aim,
  open: (id) => (id === 'labo' ? openLab() : openProject(id)),   // the lab asks for its password first (lab-gate.js)
}
let mode = PROJECTS_MODE

// lay out a mode's badges (the grid stays: the wave does not move); a badge's screenshot is not in the page, only
// its address (data-shot): the cursor's image shows it (below)
function layCards(m) {
  mode = m
  row.innerHTML = m.items.map((it, i) => `
    <div class="col">
      <a href="${it.href}" data-id="${it.id}"${it.src ? ` data-shot="${it.src}"` : ''} style="--i:${i}; view-transition-name: card-${i}">
        <b>${it.title}</b>
      </a>
    </div>`).join('')
  scene.querySelector('.signature .name').textContent = m.signature
  if (warmed || m !== PROJECTS_MODE) warm()
}
// the screenshots, loaded ahead of the first hover: on the home page at the first scroll (not on arrival: the
// landscape first), in the lab at once
let warmed = false
function warm() {
  warmed = true
  row.querySelectorAll('a[data-shot]').forEach((a) => { new Image().src = a.dataset.shot })
}
addEventListener('scroll', () => { if (!warmed) warm() }, { passive: true, once: true })
const cardLink = (id) => row.querySelector(`a[data-id="${id}"]`)
// the last hovered card stays active: its place does not leave when the pointer leaves the card
function activate(id) {
  row.querySelector('a.active')?.classList.remove('active')
  cardLink(id)?.classList.add('active')
}
function hover(a) {
  if (!a || a.classList.contains('active') || !hoverAllowed()) return   // not while the cards rise (see the page)
  if (mode === PROJECTS_MODE && a.dataset.id === 'labo') return        // the lab badge has no place
  activate(a.dataset.id)
  BACKDROP.goTo(mode.aim(a.dataset.id))
}
// with a finger (no hover): a first touch leads to the card's place, a second one opens it
let lastTouch = 0
row.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') lastTouch = performance.now() })
const touchedRecently = () => performance.now() - lastTouch < 800
row.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') hover(e.target.closest('a')) })
row.addEventListener('focusin', (e) => { if (!touchedRecently()) hover(e.target.closest('a')) })   // with the keyboard too: Tab changes the place
// a modified click (⌘, Ctrl, Shift) keeps the browser's behaviour: a new tab, a new window
const modified = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
row.addEventListener('click', (e) => {
  const a = e.target.closest('a')
  if (!a || modified(e)) return
  e.preventDefault()
  if (touchedRecently() && hoverAllowed() && !a.classList.contains('active') && a.dataset.id !== 'labo') { hover(a); return }
  mode.open(a.dataset.id)
})
// with a mouse: the hovered project's screenshot follows the cursor, a little below and to the right of it
// (to the left near the right edge), gliding softly behind it
const cursorShot = el('<figure class="cursor-shot" aria-hidden="true"><img alt="" /></figure>')
document.body.append(cursorShot)
let mouse = { x: 0, y: 0 }, shown = { x: 0, y: 0 }, gliding = false
function glide() {
  shown.x += (mouse.x - shown.x) * .22; shown.y += (mouse.y - shown.y) * .22
  const w = cursorShot.offsetWidth, h = cursorShot.offsetHeight
  const x = shown.x + 24 + w > innerWidth - 12 ? shown.x - 24 - w : shown.x + 24
  const y = Math.min(innerHeight - h - 12, shown.y + 24)
  cursorShot.style.translate = `${x}px ${y}px`
  gliding = Math.abs(mouse.x - shown.x) + Math.abs(mouse.y - shown.y) > .5
  if (gliding) requestAnimationFrame(glide)
}
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return
  mouse = { x: e.clientX, y: e.clientY }
  if (!cursorShot.classList.contains('on')) shown = { ...mouse }
  if (!gliding) { gliding = true; requestAnimationFrame(glide) }
}, { passive: true })
row.addEventListener('pointerover', (e) => {
  const a = e.target.closest('a')
  if (!a || e.pointerType !== 'mouse' || !hoverAllowed() || !a.dataset.shot) return   // not while the badges rise; not for the lab
  cursorShot.querySelector('img').src = a.dataset.shot
  cursorShot.dataset.id = a.dataset.id
  cursorShot.classList.add('on')
})
row.addEventListener('pointerout', (e) => { if (e.target.closest('a') && !e.relatedTarget?.closest?.('.row a')) cursorShot.classList.remove('on') })
addEventListener('scroll', () => cursorShot.classList.remove('on'), { passive: true })
// the image a project's page grows from (project.js): the screenshot following the cursor, if it shows this project
const thumbFor = (id) => (cursorShot.classList.contains('on') && cursorShot.dataset.id === id ? cursorShot.querySelector('img') : null)
layCards(PROJECTS_MODE)
