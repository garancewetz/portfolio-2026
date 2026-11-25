// The browser tab: when you switch to another tab, the little man falls asleep, and the tab title says so
// (z, z z, z z z). Everything goes back to normal on your return.

const TITLE = document.title
let timer = 0
const stop = () => {
  clearInterval(timer)
  document.title = TITLE
}

// he sleeps: the title counts his z's (hidden tabs' timers slow down: one per second is enough)
export function sleepInTab() {
  stop()
  let n = 0
  const draw = () => {
    document.title = `${'z '.repeat((n++ % 3) + 1).trim()} — ${TITLE}`
  }
  draw()
  timer = window.setInterval(draw, 1000)
  return stop
}
