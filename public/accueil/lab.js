// The lab (the notebook of experiments), in the home page itself: « labo → » turns the cards into experiments, the
// page changes shape (« labo » large at the top, the yeti standing on its o; the experiments as badges, on the line of
// « hello, world. »; no scrolling), and the backdrop goes to Arles: from Trinquetaille, across the Rhône, the rock of the old town and
// the Roquette at its feet (the bare ground, from IGN's laser), reflected in the river. It arrives at night; each
// experiment sets another hour, from dawn to the starry night: the light (the sun's angle and height) and the blue.
// Clicking an experiment: the camera moves into the backdrop (see approach, project.js), then it opens. « hello,
// world. » brings the home page back. The address follows (?labo): the lab opens directly, and the browser's back
// button works (route(), below, for the whole page).
// Uses BACKDROP, aim, scrollDriven, layCards, activate, PROJECTS_MODE, scene (cards.js), approach, transition,
// openProject, closeProject, openId (project.js), RELIEF_SETTINGS, placeWeights (relief-shader.js, reliefs.js), YETI,
// SHOTS (data.js), calm, QUERY (header.js).
const LAB_SITE = ''   // the experiments: their own pages, on this site
// in the order of the day (their hours: HOURS, below)
const LAB_PAGES = [
  { id: 'ruban', title: 'ruban', href: '/ruban/' },
  { id: 'toupies', title: 'toupies', href: '/toupies/' },
  { id: 'abyme', title: 'abyme', href: '/abyme/' },
  { id: 'murmuration', title: 'murmuration', href: '/murmuration/' },
  { id: 'creatures', title: 'créatures', href: '/creatures/' },
]
// the hours over Arles: the blue (more or less dark), the sun (angle, height), the stars. The gaze dips a little: the
// Rhône and the rock above the cards.
const ARLES = { ...RELIEF_SETTINGS.rest, ...placeWeights('arles'), gaze: .18, rise: 1, center: [0, 0] }
const hourSetting = (tint, sky, light, sun, stars = 0) => ({ ...ARLES, tint, sky, light, sun, stars })
const HOURS = {
  rest: hourSetting('#151a92', '#3c48cc', -1.6, .3, .7),          // arriving: the blue night, a few stars
  toupies: hourSetting('#2b46ea', '#c3c8ff', -3.0, .12),          // dawn: the sun skimming the water
  murmuration: hourSetting('#2a1690', '#6a4fd6', -.3, .1, .25),   // indigo dusk
  creatures: hourSetting('#0d1266', '#26308f', -1.6, .3, .85),    // the starry night, under the moon
  ruban: hourSetting('#070a3c', '#151c5e', -4.6, .25, 1),         // the dark night
  abyme: hourSetting('#1414e6', '#9a9aff', -2.2, .9),             // noon: the blue of the home page
}
// leaving for an experiment: the camera moves in, then the page goes; cancelled if we leave the lab meanwhile
let departure = 0
function cancelDeparture() {
  clearTimeout(departure)
  document.documentElement.classList.remove('leaving')
}
const LAB_MODE = {
  items: LAB_PAGES.map((x) => ({ id: x.id, title: x.title, src: SHOTS + x.id + '.webp', href: LAB_SITE + x.href })),
  signature: 'labo',
  aim: (id) => ({ ...HOURS[id], ...scrollDriven(), rise: 1 }),
  open: (id) => {
    const href = LAB_SITE + LAB_PAGES.find((p) => p.id === id).href
    if (calm) { location.href = href; return }
    cancelDeparture()
    document.documentElement.classList.add('leaving')
    approach(1)
    departure = setTimeout(() => { location.href = href }, 900)
  },
}

// the yeti, standing on the o of « labo »; now and then (every 3 to 8 s) it jumps, flaps its arms and lands
const yeti = el('<pre class="yeti mono" aria-hidden="true"></pre>')
scene.querySelector('.signature').append(yeti)
// (the poses are drawn at their height in the jump, with empty lines below: those are removed, so that its feet stay
// in place; the CSS animation moves it up and down, softly)
const POSES = YETI.map((f) => {
  const l = f.split('\n'); while (l.length && !l[l.length - 1].trim()) l.pop()
  while (l.length < 7) l.unshift(' '.repeat(9))
  return l.join('\n')
})
const pose = (k) => { yeti.textContent = POSES[k] }
const STANDING = 4
// on the o: centred on the last letter, its feet on the top of the o (from the font's own metrics)
function placeYeti() {
  const name = scene.querySelector('.signature .name'), t = name.firstChild
  if (!inLab || !t) return
  const r = document.createRange(); r.setStart(t, t.length - 1); r.setEnd(t, t.length)
  const o = r.getBoundingClientRect(), s = scene.querySelector('.signature').getBoundingClientRect()
  const st = getComputedStyle(name), m = Object.assign(document.createElement('canvas').getContext('2d'), { font: `${st.fontWeight} ${st.fontSize} ${st.fontFamily}` }).measureText('o')
  const topOfO = o.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent
  const below = parseFloat(getComputedStyle(yeti).fontSize) * .3   // the bottom of its last line, under the characters
  yeti.style.left = `${o.left + o.width / 2 - s.left - yeti.offsetWidth / 2}px`
  yeti.style.top = `${topOfO - s.top - yeti.offsetHeight + below}px`
}
addEventListener('resize', placeYeti)
let jumpTimer = 0, poseTimers = []
function stopJumping() {
  clearTimeout(jumpTimer); poseTimers.forEach(clearTimeout)
  yeti.classList.remove('jumping')
}
function jump() {
  stopJumping()
  if (!inLab || calm) return
  void yeti.offsetWidth; yeti.classList.add('jumping')
  // crouching, the take-off, then up there it flaps softly (arms up, flat); it comes down arms flat, lands crouching
  const steps = [[0, 0], [180, 1], [380, 2], [640, 3], [900, 2], [1160, 3], [1500, 0], [1700, STANDING]]
  poseTimers = steps.map(([t, k]) => setTimeout(() => pose(k), t))
  jumpTimer = setTimeout(jump, 3000 + Math.random() * 5000)
}

// the home page as it was left (the scroll, the active card, its place), to find it again on the way back
let inLab = false, homeScroll = 0, homeActive = null
function enterLab({ history: push = true, instant = false } = {}) {
  if (inLab) return
  inLab = true
  homeScroll = scrollY
  homeActive = scene.querySelector('.row a.active')?.dataset.id || null
  if (push) history.pushState({ lab: true }, '', LAB_URL)
  document.title = 'Labo — Garance Wetzel'
  BACKDROP.goTo(LAB_MODE.aim('rest'))
  const update = () => {
    layCards(LAB_MODE)
    document.documentElement.classList.add('in-lab')
    scrollTo(0, 0)
    pose(STANDING); placeYeti(); document.fonts.ready.then(placeYeti)
  }
  instant ? update() : transition(update)
  if (!calm) jumpTimer = setTimeout(jump, 1500)
}
// then: what to show instead of the home page (a project page, when going back to it)
function leaveLab({ history: push = true, then = null } = {}) {
  if (!inLab) return
  inLab = false
  stopJumping()
  cancelDeparture()
  approach(0, true)
  if (push) history.pushState({}, '', location.pathname)
  document.title = 'Garance Wetzel'
  transition(() => {
    layCards(PROJECTS_MODE)
    document.documentElement.classList.remove('in-lab')
    scrollTo(0, homeScroll)
    if (homeActive) activate(homeActive)
    then ? then() : BACKDROP.goTo(aim(homeActive || 'rest'))
  })
}

// the « labo → » badge opens the lab (cards.js); « hello, world. », in the lab, goes home
document.querySelector('.top-bar .home').addEventListener('click', (e) => {
  if (!inLab) return
  e.preventDefault()
  e.stopImmediatePropagation()
  leaveLab()
}, true)
// the browser's back and forward buttons, for the whole page: the lab, a project page, or the home page
function route() {
  const q = new URLSearchParams(location.search), id = q.get('p')
  if (q.has('labo')) { closeProject({ history: false, instant: true }); enterLab({ history: false }); return }
  if (inLab) { leaveLab({ history: false, then: id && (() => openProject(id, { history: false, instant: true })) }); return }
  id ? openProject(id, { history: false }) : closeProject({ history: false })
}
addEventListener('popstate', route)
// back from an experiment with the back button (the page kept in memory): out of the backdrop again
addEventListener('pageshow', (e) => {
  if (!e.persisted) return
  cancelDeparture()
  approach(0, true)
})
if (QUERY.has('labo')) enterLab({ history: false, instant: true })
