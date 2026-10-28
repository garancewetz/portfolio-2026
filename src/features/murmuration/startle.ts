import { MAX } from './flock'
import { perchCol, perchRow, places } from './perches'

// les oiseaux posés qu'on dérange en passant la souris dessus : quand ils se sont envolés (en secondes, horloge
// réelle), et combien de temps dure leur petit tour avant de revenir à leur place
export const startled = new Float64Array(MAX).fill(-1e9)
// (de quel côté il part : décidé une fois, au moment où il s'envole, à l'opposé de la souris ; ensuite il finit
// son tour sans s'occuper d'elle)
const startledSide = new Int8Array(MAX).fill(1)
// (et chacun son tour, tiré au moment de l'envol : sa durée, sa hauteur, sa distance ; d'où il part, s'il change
// de place en se reposant)
export const startledSpan = new Float32Array(MAX)
export const startledLift = new Float32Array(MAX)
export const startledDrift = new Float32Array(MAX)
export const startledFromX = new Float32Array(MAX)
export const startledFromY = new Float32Array(MAX)
export const STARTLE_NEAR = 46 // (en pixels autour de la souris)
const STARTLE_TIME = 2.2
// faire s'envoler l'oiseau i (posé, en x, y) à l'instant seconds, vers le côté side (1 : la droite, -1 : la
// gauche) : la plupart font un petit saut, quelques-uns vont un peu plus loin et plus haut ; un sur cinq se
// repose ailleurs, sur une place voisine
export function startle(i: number, x: number, y: number, seconds: number, side: number) {
  const far = Math.random() ** 2 // (souvent petit, parfois grand)
  startled[i] = seconds
  startledSide[i] = side
  startledSpan[i] = STARTLE_TIME * (0.75 + 0.7 * far + 0.2 * Math.random())
  startledLift[i] = 40 + 110 * far + 25 * Math.random()
  startledDrift[i] = (25 + 95 * Math.random() ** 2) * side
  startledFromX[i] = x
  startledFromY[i] = y
  if (Math.random() < 0.2 && places.length) {
    const here = places.findIndex(([c]) => c >= perchCol[i])
    const reach = Math.round(places.length * (0.01 + 0.04 * far)) * side
    const [c, r] =
      places[Math.min(places.length - 1, Math.max(0, here + reach + Math.round((Math.random() - 0.5) * 6)))]
    perchCol[i] = c
    perchRow[i] = r
  }
}
