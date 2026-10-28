// L'onglet du navigateur : quand on part sur un autre onglet, le bonhomme s'endort, et le titre de l'onglet le dit
// (z, z z, z z z). Tout revient comme avant au retour.

const TITLE = document.title
let timer = 0
const stop = () => {
  clearInterval(timer)
  document.title = TITLE
}

// il dort : le titre compte ses z (les minuteries des onglets cachés ralentissent : une par seconde suffit)
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
