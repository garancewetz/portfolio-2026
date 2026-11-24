// The birds, as on a phenakistiscope disc (Plateau's optical toy, 1833): on the tinplate, near the rim, eight
// times the same bird, in profile, at eight moments of a wingbeat, facing the way the top spins. At rest, a ring
// of birds; spinning, a grey ring.

const POSES = 8

// g: the tinplate image (W wide: one turn; to the right, the way it spins, seen from the front); v: the height
// of the ring; s: the size of a bird, in pixels
export function birds(g: CanvasRenderingContext2D, W: number, v: number, s: number, ink: string) {
  g.save()
  g.fillStyle = ink
  for (let k = 0; k < POSES; k++) bird(g, (k + 0.5) * (W / POSES), v, s, -k / POSES)
  g.restore()
}

// a bird in profile, facing right; phase: the moment of the wingbeat (0: wings all the way up)
function bird(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, phase: number) {
  const w = Math.cos(phase * Math.PI * 2)
  // (the body dips a little when the wings are up, rises when they push down)
  const by = cy + w * 0.06 * s
  // the far wing, a little paler, then the body, the head, the tail, the near wing
  g.globalAlpha = 0.45
  wing(g, cx - 0.04 * s, by, s, w * 0.92)
  g.globalAlpha = 1
  g.beginPath()
  g.ellipse(cx, by, 0.27 * s, 0.1 * s, -0.08, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.arc(cx + 0.28 * s, by - 0.07 * s, 0.085 * s, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.moveTo(cx + 0.34 * s, by - 0.1 * s)
  g.lineTo(cx + 0.47 * s, by - 0.06 * s)
  g.lineTo(cx + 0.34 * s, by - 0.035 * s)
  g.fill()
  g.beginPath()
  g.moveTo(cx - 0.2 * s, by - 0.02 * s)
  g.lineTo(cx - 0.47 * s, by - 0.1 * s)
  g.lineTo(cx - 0.44 * s, by + 0.06 * s)
  g.fill()
  wing(g, cx, by, s, w)
}

// a wing: from the shoulder to its tip, up (w = 1) or down (w = −1); halfway, it comes towards us and looks
// shorter
function wing(g: CanvasRenderingContext2D, cx: number, by: number, s: number, w: number) {
  const reach = 0.25 + 0.4 * Math.abs(w)
  const tip = { x: cx - 0.16 * s, y: by - Math.sign(w || 1) * reach * s }
  g.beginPath()
  g.moveTo(cx + 0.13 * s, by - 0.03 * s)
  g.quadraticCurveTo(cx + 0.08 * s, by - w * 0.4 * s, tip.x, tip.y)
  g.quadraticCurveTo(cx - 0.12 * s, by - w * 0.22 * s, cx - 0.12 * s, by)
  g.closePath()
  g.fill()
}
