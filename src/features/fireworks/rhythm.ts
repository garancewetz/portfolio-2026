import { around } from './salvos'

// Le rythme d'un feu d'artifice, comme un vrai spectacle : des fusées seules ou par deux, puis un bouquet, puis un
// court silence, et on recommence. Partagé par le mode feu d'artifice de l'accueil (Fireworks.tsx) et la page du
// labo (features/feu). rocket : une fusée ; end (facultatif) : quand le spectacle doit finir (after), et ce qui se
// passe alors (then : le bouquet final) ; pace (facultatif) : la cadence (2 : deux fois plus de tirs). Renvoie de
// quoi l'arrêter. Et son allure, commune aux deux : le halo, la
// fumée, les étoiles, la taille d'une gerbe proche.
const SOLO = [650, 1300] // ms entre deux tirs (une ou deux fusées)
const BOUQUET = [6, 10] // fusées dans un bouquet
const REST = [1200, 1800] // ms de silence après un bouquet
// le halo liquide : peu de couleur, qui se dissout vite, sans tourbillons (une lueur, pas des marbrures)
export const HALO = { ink: 0.09, fade: 1.6, curl: 5 }
// la fumée : gris-bleu, très légère, qui se dissipe lentement (elle s'accumule) en tournoyant un peu
export const SMOKE = { ink: 0.014, tint: [0.62, 0.64, 0.78], fade: 0.3, curl: 4 }
export const STARS = 170
export const NEAR = 1.45 // à partir de cette taille, une gerbe est proche : elle éclate devant (les cartes, le ciel)

export function rhythm(
  rocket: () => void,
  end?: { after: () => boolean; then: () => void },
  pace: () => number = () => 1,
) {
  let shots = 2
  let timer = 0
  const next = () => {
    if (end?.after()) return end.then()
    // (onglet caché : les images ne sont plus dessinées, les gerbes s'empileraient sans s'éteindre ; on attend)
    if (document.hidden) {
      timer = window.setTimeout(next, 500)
      return
    }
    if (shots > 0) {
      // une fusée, parfois deux à la fois
      shots--
      rocket()
      if (Math.random() < 0.4) setTimeout(rocket, around(80, 240) / pace())
      timer = window.setTimeout(next, around(SOLO[0], SOLO[1]) / pace())
      return
    }
    // le bouquet, puis le silence, puis à nouveau quelques tirs
    shots = 3 + Math.floor(Math.random() * 3)
    const n = Math.round(around(BOUQUET[0], BOUQUET[1]))
    for (let i = 0; i < n; i++) setTimeout(rocket, (i * around(80, 180)) / pace())
    timer = window.setTimeout(next, around(REST[0], REST[1]) / pace())
  }
  timer = window.setTimeout(next, 500)
  return () => clearTimeout(timer)
}
