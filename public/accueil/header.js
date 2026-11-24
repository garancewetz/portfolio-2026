// The header (« hello, world. », alone: the lab is a badge among the projects, see cards.js) and a few tools shared by all scripts: the
// arrival query, `calm` (for whoever asked for less motion) and the soft easing curve.
const QUERY = new URLSearchParams(location.search)   // the address on arrival (?p=id, ?labo…)
const LAB_URL = '?labo'                               // the lab opens in the page itself (see lab.js)
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10)   // from 0 to 1, starting and ending softly

document.body.prepend(el(`
  <header class="top-bar mono">
    <a class="home" href="/">hello, world<span class="dot">.</span></a>
  </header>`))
// « hello, world. »: on the home page, it scrolls back to the top (from a project page or the lab, project.js and
// lab.js catch the click first and bring the home page back)
document.querySelector('.top-bar .home').addEventListener('click', (e) => {
  e.preventDefault()
  scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
})
