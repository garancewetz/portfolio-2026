import * as THREE from 'three'
import { addCheeks, addEyes, addSmile, frontZ, material, mesh, sphere, type Mascot } from './parts'
import { PROPS, HOLD, type Prop } from './props'

// Pousse, Kit's mascot: a mint blob with a sprout on its head, waving. One mascot for every step of a ticket: its
// colour and what it holds tell the step (see main.ts); once shipped, the sprout flowers.

const MINT = 0x5fd3c1

function pousse({ skin = MINT, bloom = false }): Mascot {
  const root = new THREE.Group()
  const body = material(skin)
  const shape: [number[], number[]] = [[0.95, 0.88, 0.85], [0, 0, 0]]
  root.add(mesh(sphere, body, { scale: shape[0] }))
  for (const side of [-1, 1]) root.add(mesh(sphere, body, { position: [side * 0.4, -0.82, 0.15], scale: [0.26, 0.16, 0.3] }))
  const limb = new THREE.CapsuleGeometry(0.13, 0.28, 8, 16)
  root.add(mesh(limb, body, { position: [-0.92, -0.2, 0.1], rotation: [0, 0, -0.7] }))
  // the raised arm, waving
  const arm = new THREE.Group()
  arm.position.set(0.82, 0.02, 0.1)
  arm.add(mesh(limb, body, { position: [0.12, 0.14, 0], rotation: [0, 0, -0.7] }))
  root.add(arm)
  // the sprout: a stem, two leaves, and a flower once shipped
  const sprout = new THREE.Group()
  sprout.position.set(0, 0.84, 0)
  const green = material(0x6cc24a)
  sprout.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12), green, { position: [0, 0.14, 0] }))
  if (bloom) {
    const flower = new THREE.Group()
    flower.position.set(0, 0.36, 0.02)
    const petal = material(0xff8fb1)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      flower.add(mesh(sphere, petal, { position: [Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0], scale: [0.13, 0.09, 0.05], rotation: [0, 0, angle] }))
    }
    flower.add(mesh(sphere, material(0xffd34d), { position: [0, 0, 0.04], scale: [0.09, 0.09, 0.06] }))
    sprout.add(flower)
  }
  sprout.add(mesh(sphere, green, { position: [0.15, 0.32, 0], scale: [0.17, 0.07, 0.09], rotation: [0, 0, 0.5] }))
  sprout.add(mesh(sphere, green, { position: [-0.12, 0.3, 0], scale: [0.14, 0.06, 0.08], rotation: [0, 0, -0.6] }))
  root.add(sprout)
  // the face
  const eyes = addEyes(root, { x: 0.3, y: 0.13, z: 0.74, size: 0.11 })
  addCheeks(root, { x: 0.5, y: -0.12, z: frontZ(shape, 0.5, -0.12) - 0.01, size: 0.13, tilt: 0.6 })
  addSmile(root, { y: -0.06, z: frontZ(shape, 0, -0.14) + 0.015, radius: 0.14 })
  return {
    root,
    eyes,
    update: (t) => {
      arm.rotation.z = Math.sin(t * 7) * 0.45
      sprout.rotation.z = Math.sin(t * 2.6) * 0.2
    },
  }
}

// Pousse dressed for a step: its skin, and what it holds (in the raised hand, or at its feet when too big)
export function pousseFor({ skin = MINT, prop, bloom = false }: { skin?: number; prop?: Prop; bloom?: boolean }): Mascot {
  const character = pousse({ skin, bloom })
  if (!prop) return character
  const hold = HOLD[prop]
  const carrier = new THREE.Group()
  carrier.position.set(hold.position[0], hold.position[1], hold.position[2])
  carrier.rotation.set(hold.rotation[0], hold.rotation[1], hold.rotation[2])
  carrier.scale.setScalar(hold.scale)
  carrier.add(PROPS[prop]())
  character.root.add(carrier)
  // (its hand is busy: it no longer waves, the prop bobs instead)
  const onGround = prop === 'toolbox'
  return {
    ...character,
    update: (t) => {
      if (!onGround) carrier.position.y = hold.position[1] + Math.sin(t * 3) * 0.03
    },
  }
}
