// Les oiseaux, comme sur un disque de phénakistiscope (le jouet optique de Plateau, 1833) : sur la tôle, près du
// bord, huit fois le même oiseau, de profil, à huit moments d'un battement d'ailes, tournés dans le sens où la toupie
// tourne. À l'arrêt, une ronde d'oiseaux ; en tournant, un anneau gris.

const POSES = 8

// g : l'image de la tôle (W de large : un tour ; vers la droite, le sens où elle tourne, vue de face) ; v : la
// hauteur de la ronde ; s : la taille d'un oiseau, en pixels
export function birds(g: CanvasRenderingContext2D, W: number, v: number, s: number, ink: string) {
  g.save()
  g.fillStyle = ink
  for (let k = 0; k < POSES; k++) bird(g, (k + 0.5) * (W / POSES), v, s, -k / POSES)
  g.restore()
}

// un oiseau de profil, tourné vers la droite ; phase : le moment du battement (0 : les ailes tout en haut)
function bird(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, phase: number) {
  const w = Math.cos(phase * Math.PI * 2)
  // (le corps descend un peu quand les ailes sont hautes, remonte quand elles poussent vers le bas)
  const by = cy + w * 0.06 * s
  // l'aile loin de nous, un peu plus pâle, puis le corps, la tête, la queue, l'aile proche
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

// une aile : de l'épaule à sa pointe, en haut (w = 1) ou en bas (w = −1) ; à mi-course, elle vient vers nous et
// paraît plus courte
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
