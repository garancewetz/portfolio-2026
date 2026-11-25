import * as THREE from 'three'
import { blinking, eye, furredBall, ink, type Critter } from './critters'

const TAU = Math.PI * 2
import { furMaterial, furry } from './fur'
import { glossy, mesh, smoothSphere } from './parts'

// The owl, the otter and the sloth of the Créatures page, in 3D (see critters.ts).

// the owl:   ,_,  two tufts;  (O,O)  two big eyes and a beak;  (   )  a round body (wings on its sides);  " "  feet.
// It hops now and then, and flies off its feet, its wings beating
export function owl(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const fur = 0xcfc6ef
  const onSkin = furredBall(body, { p: [0, -0.05, 0], s: [0.72, 0.85, 0.68], fur, tip: 0xffffff, length: 0.14, face: { cy: 0.32, w: 0.72, h: 0.36, colour: 0xf3effc } })
  // the two big O: white rings, dark pupils
  const eyes = [-1, 1].map((side) => {
    const x = side * 0.22
    const y = 0.22
    const z = onSkin(x, y)
    body.add(mesh(smoothSphere, glossy(0xffffff), { p: [x, y, z], s: [0.17, 0.17, 0.06] }))
    return eye(body, [x, y, z + 0.05], 0.09)
  })
  body.add(mesh(new THREE.ConeGeometry(0.06, 0.16, 16), glossy(0xffb86b), { p: [0, 0.08, onSkin(0, 0.08) + 0.06], r: [Math.PI / 2 + 0.5, 0, 0] })) // the ,
  for (const side of [-1, 1]) furry(body, fur, 0xffffff, { p: [side * 0.32, 0.78, 0], s: [0.08, 0.16, 0.08], length: 0.1, layers: 10 }) // ,_,
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.62, 0.05, 0)
    furry(pivot, 0xb9aee6, 0xffffff, { p: [side * 0.12, -0.18, 0], s: [0.16, 0.4, 0.3], length: 0.1, layers: 12 })
    body.add(pivot)
    return { pivot, side }
  })
  for (const side of [-1, 1]) root.add(mesh(smoothSphere, glossy(0xffb86b), { p: [side * 0.18, -0.95, 0.12], s: [0.1, 0.05, 0.14] }))
  return {
    object: root,
    update: (t) => {
      // a hop, and every other time it flies off: its wings beating
      const k = (t % 5) / 5
      const flying = k > 0.55 && k < 0.85 ? Math.sin(((k - 0.55) / 0.3) * Math.PI) : 0
      const hopping = k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0
      body.position.y = flying * 0.5 + hopping * 0.18
      wings.forEach(({ pivot, side }) => (pivot.rotation.z = side * (flying > 0 ? 0.3 + Math.sin(t * 22) * 0.9 : 0.05)))
      blinking(eyes, t, 3)
    },
    // its wings, wide strokes
    fly: (u, strength, clock) => {
      body.position.y = Math.sin(u * TAU) * 0.06 * strength
      wings.forEach(({ pivot, side }) => (pivot.rotation.z = side * (0.05 + (0.45 + Math.sin(u * TAU) * 0.95) * strength)))
      blinking(eyes, clock, 3)
    },
  }
}

// the otter:   (o o)  a round head;  (   )~~  a body, a long tail;  " "  feet. Playful: it sways, its tail waving
export function otter(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const fur = 0xd5c2ad
  furredBall(body, { p: [0, -0.4, 0], s: [0.62, 0.52, 0.55], fur, tip: 0xf6efe8, length: 0.13 })
  const onSkin = furredBall(body, { p: [0, 0.38, 0.05], s: [0.52, 0.46, 0.48], fur, tip: 0xf6efe8, length: 0.12, face: { cy: -0.1, w: 0.62, h: 0.5, colour: 0xf4ebe1 } })
  const eyes = [-1, 1].map((side) => eye(body, [side * 0.2, 0.46, onSkin(side * 0.2, 0.46) + 0.02], 0.06))
  body.add(mesh(smoothSphere, ink(0x3a2a24), { p: [0, 0.3, onSkin(0, 0.3) + 0.04], s: [0.08, 0.055, 0.05] })) // its nose
  for (const side of [-1, 1]) for (const dy of [0.03, -0.03]) body.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 6), glossy(0xffffff), { p: [side * 0.2, 0.27 + dy, onSkin(side * 0.1, 0.27) + 0.02], r: [0, 0, side * (Math.PI / 2 + dy * 3)] }))
  for (const side of [-1, 1]) body.add(mesh(smoothSphere, furMaterial(glossy(fur), 0), { p: [side * 0.38, 0.72, 0], s: [0.09, 0.08, 0.05] })) // little ears
  // the tail, ~~ : long and tapering, waving
  const tail = new THREE.Group()
  tail.position.set(0.5, -0.65, -0.1)
  const path = []
  for (let i = 0; i <= 24; i++) path.push(new THREE.Vector3(i * 0.04, Math.sin(i * 0.45) * 0.07, -i * 0.012))
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 64, 0.07, 10)
  // (tapering: thinner towards the tip)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, pos.getX(i) / 0.96)
    pos.setY(i, pos.getY(i) * (1 - 0.6 * k))
    pos.setZ(i, pos.getZ(i) * (1 - 0.6 * k))
  }
  tail.add(new THREE.Mesh(geometry, furMaterial(glossy(0xc3ad95), 0.4)))
  body.add(tail)
  for (const side of [-1, 1]) root.add(mesh(smoothSphere, glossy(0xc3ad95), { p: [side * 0.24, -0.93, 0.18], s: [0.12, 0.06, 0.16] }))
  return {
    object: root,
    update: (t) => {
      body.rotation.z = Math.sin(t * 1.6) * 0.08
      body.position.y = Math.abs(Math.sin(t * 1.6)) * 0.05
      tail.rotation.y = Math.sin(t * 2.4) * 0.5
      tail.rotation.z = Math.sin(t * 1.7) * 0.15
      blinking(eyes, t, 0.5)
    },
    // it swims in the air: its body waves, its tail sculling
    fly: (u, strength, clock) => {
      body.rotation.z = Math.sin(u * TAU) * 0.18 * strength
      body.position.y = Math.sin(u * TAU + 1) * 0.05 * strength
      tail.rotation.y = Math.sin(u * TAU * 2) * 0.8 * strength
      blinking(eyes, clock, 0.5)
    },
  }
}

// the sloth:   (-.-)  half asleep;  /( )\  long arms, hanging;  " "  feet. Slow, it never lets go: it sways, slowly
export function sloth(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const fur = 0xcbbfb2
  furredBall(body, { p: [0, -0.3, 0], s: [0.55, 0.62, 0.5], fur, tip: 0xf2ece6, length: 0.16 })
  const onSkin = furredBall(body, { p: [0, 0.45, 0.04], s: [0.5, 0.44, 0.46], fur, tip: 0xf2ece6, length: 0.14, face: { cy: -0.02, w: 0.72, h: 0.56, colour: 0xf3ede6 } })
  // the dark patches around its eyes, and the eyes shut: (-.-)
  for (const side of [-1, 1]) {
    const x = side * 0.17
    const y = 0.48
    body.add(mesh(smoothSphere, glossy(0x8a7a6c), { p: [x, y, onSkin(x, y) + 0.005], s: [0.13, 0.07, 0.03], r: [0, 0, side * -0.35] }))
    body.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), ink(), { p: [x, y - 0.01, onSkin(x, y) + 0.035], r: [0, 0, Math.PI] }))
  }
  body.add(mesh(smoothSphere, ink(0x3a2a24), { p: [0, 0.36, onSkin(0, 0.36) + 0.03], s: [0.06, 0.045, 0.04] })) // the .
  body.add(mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 20, Math.PI), ink(0x3a2a24), { p: [0, 0.27, onSkin(0, 0.27) + 0.02], r: [0, 0, Math.PI] })) // a calm smile
  // the long arms, / \ , hanging, with their claws
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.45, 0.05, 0.05)
    furry(pivot, fur, 0xf2ece6, { p: [side * 0.12, -0.38, 0], s: [0.13, 0.45, 0.13], length: 0.12, layers: 12 })
    for (const dx of [-0.04, 0, 0.04]) pivot.add(mesh(new THREE.ConeGeometry(0.018, 0.12, 8), glossy(0x5a4d43), { p: [side * 0.12 + dx, -0.86, 0.04], r: [Math.PI, 0, 0] }))
    pivot.rotation.z = side * 0.25
    body.add(pivot)
    return { pivot, side }
  })
  for (const side of [-1, 1]) root.add(mesh(smoothSphere, glossy(0xb3a597), { p: [side * 0.2, -0.95, 0.14], s: [0.11, 0.06, 0.15] }))
  return {
    object: root,
    update: (t) => {
      body.rotation.z = Math.sin(t * 0.5) * 0.07
      arms.forEach(({ pivot, side }) => (pivot.rotation.z = side * (0.25 + Math.sin(t * 0.5 + side) * 0.06)))
    },
    // it flies too, at its pace: its long arms in big slow strokes
    fly: (u, strength) => {
      body.position.y = Math.sin(u * TAU) * 0.05 * strength
      arms.forEach(({ pivot, side }) => (pivot.rotation.z = side * (0.25 + (0.5 + 0.5 * Math.sin(u * TAU)) * 1.3 * strength)))
    },
  }
}
