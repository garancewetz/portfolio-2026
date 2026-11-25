import { around } from './salvos'

// The rhythm of a fireworks display, like a real show: rockets alone or in pairs, then a finale, then a short
// silence, and again. Shared by the home's fireworks mode (Fireworks.tsx) and the lab page (features/feu).
// rocket: one rocket; end (optional): when the show should finish (after), and what happens then (then: the
// grand finale); pace (optional): the pace (2: twice as many shots). Returns a way to stop it. And its look,
// common to both: the halo, the smoke, the stars, the size of a near burst.
const SOLO = [650, 1300] // ms between two shots (one or two rockets)
const BOUQUET = [6, 10] // rockets in a finale
const REST = [1200, 1800] // ms of silence after a finale
// the liquid halo: little colour, dissolving fast, no swirls (a glow, not marbling)
export const HALO = { ink: 0.09, fade: 1.6, curl: 5 }
// the smoke: blue-grey, very light, slowly fading (it piles up), swirling a little
export const SMOKE = { ink: 0.014, tint: [0.62, 0.64, 0.78], fade: 0.3, curl: 4 }
export const STARS = 170
export const NEAR = 1.45 // from this size on, a burst is near: it bursts in front (of the cards, the sky)

export function rhythm(
  rocket: () => void,
  end?: { after: () => boolean; then: () => void },
  pace: () => number = () => 1,
) {
  let shots = 2
  let timer = 0
  const next = () => {
    if (end?.after()) return end.then()
    // (hidden tab: frames are no longer drawn, bursts would pile up without dying out; wait)
    if (document.hidden) {
      timer = window.setTimeout(next, 500)
      return
    }
    if (shots > 0) {
      // one rocket, sometimes two at once
      shots--
      rocket()
      if (Math.random() < 0.4) setTimeout(rocket, around(80, 240) / pace())
      timer = window.setTimeout(next, around(SOLO[0], SOLO[1]) / pace())
      return
    }
    // the finale, then the silence, then a few shots again
    shots = 3 + Math.floor(Math.random() * 3)
    const n = Math.round(around(BOUQUET[0], BOUQUET[1]))
    for (let i = 0; i < n; i++) setTimeout(rocket, (i * around(80, 180)) / pace())
    timer = window.setTimeout(next, around(REST[0], REST[1]) / pace())
  }
  timer = window.setTimeout(next, 500)
  return () => clearTimeout(timer)
}
