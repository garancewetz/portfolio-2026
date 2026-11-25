// Whichever way one scrolls: some have their wheel or trackpad set the other way round (the « natural » scrolling
// or not), and on arrival, at the very top, their first gesture moved nothing (there is nothing above). So the home
// page goes forward in the direction of the first wheel gesture: if it pulls up while at the top, the wheel is read
// the other way round from then on, for this visit, and glides like the browser's own scrolling (a wheel's notches
// never jump). A gesture down while at the top turns it back (a mere reflex upwards must not flip it for good). A
// pinch (Ctrl + wheel) stays the snow globe's (snow-globe.ts).

let decided = false
let flipped = false
// where the page glides to, and whether it is gliding
let target = 0
let gliding = false
let last = -1
const bottom = () => Math.max(0, document.documentElement.scrollHeight - innerHeight)
function glide() {
  // (the page may have grown shorter meanwhile; and if it no longer moves, it has arrived)
  target = Math.min(target, bottom())
  const gap = target - scrollY
  const stuck = scrollY === last
  last = scrollY
  if (Math.abs(gap) < 1.5 || stuck) {
    if (!stuck) scrollTo({ top: target, behavior: 'instant' })
    gliding = false
    last = -1
    return
  }
  // (a fifth of the way at each frame, never less than a pixel: the page scrolls in whole pixels)
  scrollTo({ top: scrollY + Math.sign(gap) * Math.max(1, Math.abs(gap) * 0.2), behavior: 'instant' })
  requestAnimationFrame(glide)
}

export function setupWheel() {
  addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
      if (!decided) {
        if (Math.abs(e.deltaY) < 1) return
        decided = true
        flipped = e.deltaY < 0 && scrollY <= 0
      } else if (flipped && e.deltaY > 0 && scrollY <= 0 && !gliding) flipped = false
      if (!flipped) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1
      // (from where the page is, if something else moved it meanwhile: the keyboard, the scroll bar)
      if (!gliding) target = scrollY
      target = Math.max(0, Math.min(bottom(), target - e.deltaY * unit))
      if (!gliding) {
        gliding = true
        requestAnimationFrame(glide)
      }
    },
    { passive: false },
  )
}
