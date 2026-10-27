import * as THREE from 'three'

// Les pièces de la toupie à pompe (voir top.ts), comme sur le vrai jouet : en plastique moulé satiné, d'une couleur
// propre à chaque toupie (color) — le col à bord roulé et sa pastille rose, la poignée en cône striée, le pied
// ajouré de fenêtres ; la tige de la pompe, une lame d'acier torsadée ; et les petites fentes du sifflet, sur la
// coupelle du bas.

// (du plastique moulé satiné : doux, un reflet large et léger)
const plastic = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    sheen: 0.4,
    sheenRoughness: 0.6,
  })
const PINK = plastic('#ff9cc4')
const STEEL = new THREE.MeshStandardMaterial({ color: '#e8ebf1', metalness: 1, roughness: 0.14 })

// une pièce tournée : un profil (rayon, hauteur) adouci, tourné autour de l'axe
function turned(points: number[][], segments = 64) {
  const curve = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)))
  return new THREE.LatheGeometry(curve.getPoints(80), segments)
}

export function toy(group: THREE.Group, bodyTop: number, bodyBottom: number, color: string) {
  const PLASTIC = plastic(color)
  // la pompe (la tige et la poignée) : une pièce à part, qui s'enfonce quand on appuie (voir main.ts)
  const plunger = new THREE.Group()
  group.add(plunger)
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, y = 0, parent: THREE.Object3D = group) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.y = y
    parent.add(m)
    return m
  }
  // le col : un manchon au bord roulé, et sa pastille rose, bombée
  add(
    turned([[0.24, 0], [0.265, 0.02], [0.27, 0.1], [0.262, 0.17], [0.235, 0.2], [0.2, 0.205], [0.14, 0.2]]),
    PLASTIC,
    bodyTop - 0.02,
  )
  add(turned([[0.14, 0], [0.13, 0.025], [0.09, 0.045], [0.0, 0.055]]), PINK, bodyTop + 0.18)
  // la tige de la pompe : une lame de métal torsadée
  const length = 0.74
  const blade = new THREE.BoxGeometry(0.058, length, 0.012, 1, 140, 1)
  const pos = blade.attributes.position
  for (let k = 0; k < pos.count; k++) {
    const t = pos.getY(k) * 30
    const x = pos.getX(k)
    const z = pos.getZ(k)
    pos.setXYZ(k, x * Math.cos(t) - z * Math.sin(t), pos.getY(k), x * Math.sin(t) + z * Math.cos(t))
  }
  blade.computeVertexNormals()
  const rodBase = bodyTop + 0.22
  add(blade, STEEL, rodBase + length / 2, plunger)
  // la poignée : un cône arrondi, strié tout autour, et son petit bouton
  const knob = turned(
    [[0.02, 0], [0.06, 0.005], [0.1, 0.03], [0.15, 0.16], [0.16, 0.2], [0.15, 0.225], [0.1, 0.235], [0.06, 0.24]],
    72,
  )
  const kp = knob.attributes.position
  for (let k = 0; k < kp.count; k++) {
    const x = kp.getX(k)
    const z = kp.getZ(k)
    const a = Math.atan2(z, x)
    // (douze stries, à peine creusées)
    const f = 1 - 0.05 * Math.max(0, Math.cos(a * 12)) ** 6
    kp.setXYZ(k, x * f, kp.getY(k), z * f)
  }
  knob.computeVertexNormals()
  const top = rodBase + length - 0.02
  add(knob, PLASTIC, top, plunger)
  add(turned([[0.06, 0], [0.065, 0.03], [0.05, 0.06], [0, 0.07]]), PLASTIC, top + 0.235, plunger)
  // le pied : un anneau en haut, un en bas, six montants entre les deux (des fenêtres), puis la pointe
  const footTop = bodyBottom + 0.02
  add(turned([[0.22, 0], [0.255, -0.02], [0.25, -0.07], [0.22, -0.08]]), PLASTIC, footTop)
  add(turned([[0.11, 0], [0.12, -0.02], [0.115, -0.06], [0.09, -0.07]]), PLASTIC, footTop - 0.3)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.035), PLASTIC)
    const r = 0.17
    strut.position.set(Math.sin(a) * r, footTop - 0.19, Math.cos(a) * r)
    strut.rotation.y = a
    // (incliné vers l'axe, comme le cône du pied)
    strut.rotateX(0.42)
    group.add(strut)
  }
  add(turned([[0.07, 0], [0.065, -0.05], [0.035, -0.11], [0.0, -0.13]]), PLASTIC, footTop - 0.37)
  // les fentes du sifflet, sur la coupelle du bas : de petites ouvertures sombres, tout autour
  // (les fentes : en tournant vite, l'œil n'en voit plus qu'un anneau à peine plus sombre)
  const DARK = new THREE.MeshStandardMaterial({ color: '#05081a', roughness: 0.8, transparent: true })
  const slots = (onSurface: (polar: number, ra: number) => THREE.Vector3) => {
    for (let k = 0; k < 14; k++) {
      const ra = (k / 14) * Math.PI * 2
      const p = onSurface(Math.PI * 0.62, ra)
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.012), DARK)
      slot.position.copy(p.multiplyScalar(1.003))
      slot.lookAt(p.clone().multiplyScalar(2))
      group.add(slot)
    }
  }
  return { plunger, slots, slotsBlur: (b: number) => (DARK.opacity = 1 - 0.85 * b) }
}
