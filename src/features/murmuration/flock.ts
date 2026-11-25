// The birds (see main.ts): each with its place in the sheet, its delay, its rhythm; and the flight sequence
// (when they take off, when they land again).

// MAX: the space reserved (the largest flock possible); the settings (the cog wheel, see settings.ts) say
// how many fly, how fast, and for how long
export const MAX = 15000
export const settings = { count: 6000, speed: 1, fly: 25 }
// the sequence, in seconds of flight: at first, they are perched; a click makes them take off (spread over a
// few seconds, each taking LIFT_TIME seconds to join the cloud); settings.fly seconds later, they land again
// (spread over LAND_SPREAD seconds, each taking up to LAND_TIME seconds to come down to its place); and so on
const LIFT_TIME = 2.5
export const LAND_SPREAD = 10
// (the longest: each takes between half and all of this time)
export const LAND_TIME = 5
// the areas where they land (bits of roofs and ground), which fill up one after the other
export const ZONES = 8
// before landing, the cloud lowers above the village and tightens (for DESCENT seconds, starting a few seconds
// before the first ones land); on take-off, it first forms there, low and tight, then rises
export const DESCENT = 7
export const RISE = 8
// each take-off: its time (in seconds of flight), the spot of the click (where the alarm starts), and, if a click
// mid-flight called them back, when they land (otherwise, settings.fly seconds after take-off)
let lifts: { at: number; x: number; y: number; land?: number }[] = []
// a take-off at time clock, from (x, y) (those planned after it are forgotten)
export function lift(clock: number, x: number, y: number) {
  lifts = [...lifts.filter(({ at }) => at < clock), { at: clock, x, y }]
}
// a click mid-flight, at time clock: the cloud lowers at once above the village and the birds land (if they are
// not already doing so); returns true if so
export function land(clock: number) {
  const { liftAt } = cycle(clock)
  const current = lifts.find(({ at }) => at === liftAt)
  if (!current || landing(clock)) return false
  current.land = clock + DESCENT - 2
  return true
}
// landing (the cloud is coming down, or birds are still in the air): a click sends them off again
export function landing(clock: number) {
  const { liftAt, landAt } = cycle(clock)
  return liftAt !== null && clock >= landAt - DESCENT + 2 && !landed(clock)
}
// where the flight stands at time clock: since when they have been gone (or null), when they will land, and
// when they had started landing the previous time (before: a take-off can interrupt a landing, those still in
// the air start again from where they are)
export function cycle(clock: number) {
  let landAt = -Infinity
  let before = -Infinity
  let liftAt: number | null = null
  let fromX = 0
  let fromY = 0
  for (const { at, x, y, land } of lifts) {
    // (a new take-off, as soon as the cloud has started coming down to land)
    if (at <= clock && at >= landAt - DESCENT + 2) {
      before = landAt
      liftAt = at
      landAt = land ?? at + settings.fly
      fromX = x
      fromY = y
    }
  }
  return { landAt, liftAt, fromX, fromY, before }
}
// all perched?
export const landed = (clock: number) => clock >= cycle(clock).landAt + LAND_SPREAD + LAND_TIME
// the largest delay of a bird behind those in front, in seconds (a turn crosses the cloud in about half a
// second, as with real starlings)
export const MAX_LAG = 0.6
// (the delays are sorted into a few steps: the sheet's pose is only computed once per step)
export const LAGS = 48
// each bird: its place in the sheet (u, v, in a disc), its delay, and a little floating of its own
export const u = new Float32Array(MAX)
export const v = new Float32Array(MAX)
export const seed = new Float32Array(MAX)
export const lag = new Uint8Array(MAX)
// each bird's offset from its place, when the mouse made it flee (in pixels), and its momentum
export const ox = new Float32Array(MAX)
export const oy = new Float32Array(MAX)
export const ovx = new Float32Array(MAX)
export const ovy = new Float32Array(MAX)
// on take-off, the alarm starts from the spot of the click and spreads step by step (ALARM pixels per second):
// each bird leaves when it reaches it, with a small delay of its own, and takes its own time to join the cloud
export const leave = new Float32Array(MAX)
export const leaveTime = new Float32Array(MAX)
export const ALARM = 450
// when it lands (seconds after the landing started: they do not all land together)
export const settle = new Float32Array(MAX)
// (and the time it takes to come down)
export const landTime = new Float32Array(MAX)
for (let i = 0; i < MAX; i++) {
  const a = Math.random() * Math.PI * 2
  // (a disc with frayed edges: a few lone birds around the cloud)
  const r = i % 16 === 0 ? 1 + 0.5 * Math.random() : Math.sqrt(Math.random())
  u[i] = r * Math.cos(a) * (1 + 0.15 * Math.random())
  v[i] = r * Math.sin(a) * (1 + 0.15 * Math.random())
  seed[i] = Math.random() * 1000
  // those at the back (small u) and on the edges follow with more delay, and each has a little of its own: a turn
  // starts from the front and spreads through the cloud, which stretches into streaks
  const late = 0.5 * (1 - (u[i] + 1) / 2) + 0.2 * Math.abs(v[i]) + 0.3 * Math.random()
  lag[i] = Math.min(LAGS - 1, Math.floor(Math.max(0, late) * LAGS))
  landTime[i] = LAND_TIME * (0.5 + 0.5 * Math.random())
  leave[i] = 0.6 * Math.random() ** 2
  leaveTime[i] = LIFT_TIME * (0.7 + 0.8 * Math.random())
}
