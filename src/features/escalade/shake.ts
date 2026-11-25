// The window being moved on the screen: its position (screenX, screenY), frame after frame, gives its speed,
// then its acceleration (px/s²). The little man feels it in reverse, like a passenger when the bus brakes
// (body.ts). Smoothed a little (otherwise an uneven mouse step would cause jolts), and capped.

const SMOOTH = 0.35 // share of the new measurement, on each frame
const MAX = 20000 // px/s², at most

export function createShake() {
  let px = screenX
  let py = screenY
  let vx = 0
  let vy = 0
  let ax = 0
  let ay = 0
  return function sample(dt: number) {
    if (dt <= 0) return { ax: 0, ay: 0 }
    const nvx = (screenX - px) / dt
    const nvy = (screenY - py) / dt
    px = screenX
    py = screenY
    const clamp = (n: number) => Math.max(-MAX, Math.min(MAX, n))
    ax += (clamp((nvx - vx) / dt) - ax) * SMOOTH
    ay += (clamp((nvy - vy) / dt) - ay) * SMOOTH
    vx = nvx
    vy = nvy
    return { ax, ay }
  }
}
