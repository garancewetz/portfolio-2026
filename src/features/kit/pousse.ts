import * as THREE from 'three'
import { addCheeks, addEyes, addSmile, frontZ, mesh, skin as softSkin, sphere, type Ellipsoid } from './parts'

// Pousse, Kit's mascot: a mint blob with a sprout on its head. Always the same Pousse, the same size: only its
// outfit changes with what it announces (see looks.ts). This builds the bare character, with handles on the parts a
// look moves: the raised arm, the sprout, the eyes, the mouth.

export const MINT = 0x5fd3c1
// the body: what the face and the plaster sit on
export const BODY: Ellipsoid = [[0.95, 0.88, 0.85], [0, 0, 0]]

export type Pose = ReturnType<typeof pousse>

// faded: greyed out (Kit's server no longer answers), skin, sprout and cheeks drained of their colour
export function pousse({ skin = MINT, bloom = false, faded = false }: { skin?: number; bloom?: boolean; faded?: boolean } = {}) {
  const root = new THREE.Group()
  const body = softSkin(faded ? 0xb9bec7 : skin, faded ? 0.25 : 0.55)
  root.add(mesh(sphere, body, { scale: BODY[0] }))
  for (const side of [-1, 1]) root.add(mesh(sphere, body, { position: [side * 0.4, -0.82, 0.15], scale: [0.26, 0.16, 0.3] }))
  const limb = new THREE.CapsuleGeometry(0.13, 0.28, 8, 16)
  root.add(mesh(limb, body, { position: [-0.92, -0.2, 0.1], rotation: [0, 0, -0.7] }))
  // the raised arm: it waves, or holds what the outfit holds
  const arm = new THREE.Group()
  arm.position.set(0.82, 0.02, 0.1)
  arm.add(mesh(limb, body, { position: [0.12, 0.14, 0], rotation: [0, 0, -0.7] }))
  root.add(arm)
  // the sprout: a stem, two leaves, and a flower once shipped; matte, a little velvet, like the skin
  const sprout = new THREE.Group()
  sprout.position.set(0, 0.84, 0)
  const green = softSkin(faded ? 0x9aa39c : 0x6cc24a, 0.3)
  sprout.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12), green, { position: [0, 0.14, 0] }))
  const flower = new THREE.Group()
  if (bloom) {
    flower.position.set(0, 0.36, 0.02)
    const petal = softSkin(0xff8fb1, 0.4)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      flower.add(mesh(sphere, petal, { position: [Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0], scale: [0.13, 0.09, 0.05], rotation: [0, 0, angle] }))
    }
    flower.add(mesh(sphere, softSkin(0xffd34d, 0.3), { position: [0, 0, 0.04], scale: [0.09, 0.09, 0.06] }))
    sprout.add(flower)
  }
  sprout.add(mesh(sphere, green, { position: [0.15, 0.32, 0], scale: [0.17, 0.07, 0.09], rotation: [0, 0, 0.5] }))
  sprout.add(mesh(sphere, green, { position: [-0.12, 0.3, 0], scale: [0.14, 0.06, 0.08], rotation: [0, 0, -0.6] }))
  root.add(sprout)
  const eyes = addEyes(root, { x: 0.3, y: 0.13, z: 0.74, size: 0.11 })
  addCheeks(root, { x: 0.5, y: -0.12, z: frontZ(BODY, 0.5, -0.12) - 0.01, size: 0.13, tilt: 0.6, color: faded ? 0xc9c3c6 : 0xff8a94 })
  const mouthZ = frontZ(BODY, 0, -0.14) + 0.015
  const smile = addSmile(root, { y: -0.06, z: mouthZ, radius: 0.14 })
  // (the flower is empty, and not on the sprout, unless it blooms)
  return { root, body, arm, sprout, flower, eyes, smile, mouthZ }
}
