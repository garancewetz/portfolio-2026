import { MAX } from './flock'
import { perchCol, perchRow, places } from './perches'

// the perched birds disturbed by passing the mouse over them: when they took off (in seconds, real clock), and
// how long their little loop lasts before coming back to their place
export const startled = new Float64Array(MAX).fill(-1e9)
// (which side it leaves towards: decided once, when it takes off, away from the mouse; then it finishes its loop
// without minding it)
const startledSide = new Int8Array(MAX).fill(1)
// (and each its own loop, drawn at take-off: its duration, its height, its distance; where it starts from,
// whether it changes place when landing again)
export const startledSpan = new Float32Array(MAX)
export const startledLift = new Float32Array(MAX)
export const startledDrift = new Float32Array(MAX)
export const startledFromX = new Float32Array(MAX)
export const startledFromY = new Float32Array(MAX)
export const STARTLE_NEAR = 46 // (in pixels around the mouse)
const STARTLE_TIME = 2.2
// make bird i (perched, at x, y) take off at time seconds, towards side side (1: right, -1: left): most make a
// little hop, a few go a bit farther and higher; one in five lands elsewhere, on a nearby place
export function startle(i: number, x: number, y: number, seconds: number, side: number) {
  const far = Math.random() ** 2 // (often small, sometimes large)
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
