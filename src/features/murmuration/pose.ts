// ——— The sheet's pose at time t: where it is, how it turns, stretches and folds ———
// (sums of slow oscillations that never fall back into phase: the movement does not repeat)
export interface Pose {
  cx: number
  cy: number
  cyw: number
  syw: number
  cp: number
  sp: number
  cr: number
  sr: number
  stretchX: number
  stretchY: number
  bend: number
  wave: number
  t: number
}
export function pose(t: number, W: number, H: number): Pose {
  // the centre of the flock drifts in the upper sky, above the village
  // (slowly: seen from afar, the cloud crosses the sky in a minute or two)
  const cx = W * (0.46 + 0.18 * Math.sin(t * 0.07) + 0.07 * Math.sin(t * 0.16 + 1) + 0.03 * Math.sin(t * 0.31))
  const cy = H * (0.36 + 0.08 * Math.sin(t * 0.09 + 1) + 0.04 * Math.sin(t * 0.21) + 0.02 * Math.sin(t * 0.45 + 2))
  // the sheet turns on itself (yaw, pitch, roll): like a real flock, it turns in a few seconds
  const yaw = t * 0.25 + 1.2 * Math.sin(t * 0.35) + 0.5 * Math.sin(t * 0.9 + 2)
  const pitch = 0.9 * Math.sin(t * 0.5 + 0.4) + 0.35 * Math.sin(t * 1.1)
  const roll = 0.6 * Math.sin(t * 0.4 + 2) + 0.25 * Math.sin(t * 0.95 + 1)
  // the falcon: every twenty seconds, a wave crosses the sheet in one second
  const hunt = t % 20
  return {
    cx,
    cy,
    cyw: Math.cos(yaw),
    syw: Math.sin(yaw),
    cp: Math.cos(pitch),
    sp: Math.sin(pitch),
    cr: Math.cos(roll),
    sr: Math.sin(roll),
    // it stretches and tightens, and folds more or less
    stretchX: 1 + 0.25 * Math.sin(t * 0.6) + 0.1 * Math.sin(t * 1.4 + 1),
    stretchY: 0.55 + 0.18 * Math.sin(t * 0.5 + 2) + 0.07 * Math.sin(t * 1.2),
    bend: 1.0 * Math.sin(t * 0.45 + 1) + 0.4 * Math.sin(t * 1.1 + 3),
    wave: hunt < 1 ? -1.6 + hunt * 3.2 : 99,
    t,
  }
}
