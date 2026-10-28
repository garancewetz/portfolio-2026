// La fenêtre qu'on déplace sur l'écran : sa position (screenX, screenY), image après image, donne sa vitesse, puis
// son accélération (px/s²). Le bonhomme la ressent à l'envers, comme un passager quand le bus freine (body.ts).
// Lissée un peu (sans quoi un pas de souris irrégulier ferait des à-coups), et bornée.

const SMOOTH = 0.35 // part de la nouvelle mesure, à chaque image
const MAX = 20000 // px/s², au plus

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
