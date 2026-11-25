import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { faceCap, furMaterial, furry } from './fur'
import { glossy, mesh, smoothSphere } from './parts'

// The other creatures of the lab's Créatures page, in 3D, in the yetis' manner (soft fur, varnish, soft colours):
// the robot, the mouse, the goblin (and in critters-2.ts the owl, the otter, the sloth). Each one: its object, and
// its life in its place, and how it flies once freed (see Flier, parts.ts).

export type Critter = { object: THREE.Group; update: (t: number) => void; fly: (u: number, strength: number, clock: number) => void }
const TAU = Math.PI * 2

export const ink = (c = 0x141826) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1 })
const catchLight = new THREE.MeshBasicMaterial({ color: 0xffffff })
// an eye: dark, glossy, a catch-light; returned so that it can blink
export function eye(parent: THREE.Object3D, p: number[], size = 0.07) {
  const e = new THREE.Group()
  e.position.set(p[0], p[1], p[2])
  e.add(mesh(smoothSphere, ink(), { s: [size, size * 1.2, size * 0.55] }))
  e.add(mesh(smoothSphere, catchLight, { p: [-size * 0.3, size * 0.4, size * 0.4], s: [size * 0.3, size * 0.3, size * 0.15] }))
  parent.add(e)
  return e
}
export const blinking = (eyes: THREE.Object3D[], t: number, offset = 0) => eyes.forEach((e) => (e.scale.y = (t + offset) % 4.1 < 0.14 ? 0.1 : 1))

// a furry ball with a face: the fur opens on an ellipse (centre cy, half sizes w and h, on the unit ball) where the
// skin shows; returns the depth of the skin at (x, y), to set eyes and nose on it
export function furredBall(parent: THREE.Object3D, { p = [0, 0, 0], s, fur, tip, length = 0.16, layers = 18, face }: { p?: number[]; s: number[]; fur: number; tip: number; length?: number; layers?: number; face?: { cy: number; w: number; h: number; colour: number } }) {
  const hole = face ? (x: number, y: number, z: number) => z > 0 && (x / face.w) ** 2 + ((y - face.cy) / face.h) ** 2 < 1 : null
  furry(parent, fur, tip, { p, s, length, layers, hole })
  if (face && hole) parent.add(faceCap(hole, p, s, face.colour))
  return (x: number, y: number) => p[2] + s[2] * Math.sqrt(Math.max(0, 1 - ((x - p[0]) / s[0]) ** 2 - ((y - p[1]) / s[1]) ** 2))
}

// a coil spring (the robot's), hanging down from its top, `turns` turns over `length`
function spring(length: number, turns = 5, radius = 0.07) {
  const points = []
  for (let i = 0; i <= turns * 16; i++) {
    const a = (i / 16) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(a) * radius, (-i / (turns * 16)) * length, Math.sin(a) * radius))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), turns * 32, 0.018, 8)
}

// the robot:   _|_    an antenna;  [o_o]  a square head;  /[_]\  a box, arms on springs;  | |  legs on springs
export function robot(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const white = glossy(0xf2f4ff)
  const blue = furMaterial(glossy(0x4a5cff), 0) // (its blue parts take a dye)
  const steel = glossy(0xc8cde0, { metalness: 0.6, roughness: 0.3 })
  body.add(mesh(new RoundedBoxGeometry(1.15, 0.82, 0.8, 6, 0.2), white, { p: [0, 0.5, 0] }))
  const eyes = [-1, 1].map((side) => eye(body, [side * 0.24, 0.56, 0.41], 0.08))
  body.add(mesh(new RoundedBoxGeometry(0.22, 0.04, 0.03, 2, 0.015), ink(), { p: [0, 0.38, 0.41] })) // the _
  const antenna = new THREE.Group()
  antenna.position.set(0, 0.91, 0)
  antenna.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), steel))
  antenna.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 12), steel, { p: [0, 0.18, 0] }))
  antenna.add(mesh(smoothSphere, blue, { p: [0, 0.4, 0], s: [0.09, 0.09, 0.09] }))
  body.add(antenna)
  body.add(mesh(new RoundedBoxGeometry(0.78, 0.6, 0.6, 6, 0.16), blue, { p: [0, -0.2, 0] })) // [_]
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.42, -0.02, 0)
    arm.add(mesh(spring(0.55, 5, 0.06), steel))
    arm.add(mesh(smoothSphere, white, { p: [0, -0.58, 0], s: [0.09, 0.09, 0.09] }))
    arm.rotation.z = side * 0.6
    body.add(arm)
    return { arm, side }
  })
  const legs = [-1, 1].map((side) => {
    const leg = mesh(spring(0.42, 4, 0.065), steel, { p: [side * 0.2, -0.5, 0] })
    root.add(leg)
    return leg
  })
  for (const side of [-1, 1]) root.add(mesh(new RoundedBoxGeometry(0.26, 0.1, 0.32, 3, 0.04), blue, { p: [side * 0.2, -0.95, 0.04] }))
  root.position.y = 0.05
  return {
    object: root,
    update: (t) => {
      // it bounces on its springs, its antenna wobbling
      const b = Math.abs(Math.sin(t * 3))
      body.position.y = b * 0.16
      legs.forEach((leg) => (leg.scale.y = 1 + b * 0.38))
      antenna.rotation.z = Math.sin(t * 6) * 0.18 * (1 - b)
      blinking(eyes, t)
    },
    // it floats, its springs hanging loose, its arms swinging, its antenna spinning like a little rotor
    fly: (u, strength, clock) => {
      body.position.y = Math.sin(u * TAU) * 0.05 * strength
      legs.forEach((leg) => (leg.scale.y = 1 + 0.4 * strength))
      arms.forEach(({ arm, side }) => (arm.rotation.z = side * (0.6 + Math.sin(u * TAU) * 0.45 * strength)))
      antenna.rotation.y = clock * 9 * strength
      blinking(eyes, clock)
    },
  }
}

// the mouse:   ()()   two round ears;  (o.o)~  a small round body, a tail;  " "  two feet
export function mouse(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const fur = 0xd6d2e6
  const pink = glossy(0xf6b9c4)
  const onSkin = furredBall(body, { p: [0, -0.15, 0], s: [0.72, 0.62, 0.66], fur, tip: 0xffffff, length: 0.15, face: { cy: 0.15, w: 0.55, h: 0.4, colour: 0xefe9f5 } })
  const eyes = [-1, 1].map((side) => eye(body, [side * 0.2, -0.02, onSkin(side * 0.2, -0.02) + 0.02], 0.065))
  body.add(mesh(smoothSphere, pink, { p: [0, -0.15, onSkin(0, -0.15) + 0.03], s: [0.06, 0.05, 0.05] })) // the .
  // (each ear on a pivot at its base: it twitches, and beats like a wing in the air)
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Group()
    ear.position.set(side * 0.24, 0.28, -0.05)
    ear.add(mesh(smoothSphere, furMaterial(glossy(fur), 0), { p: [side * 0.12, 0.14, 0], s: [0.3, 0.3, 0.07] }))
    ear.add(mesh(smoothSphere, pink, { p: [side * 0.12, 0.14, 0.05], s: [0.2, 0.2, 0.03] }))
    body.add(ear)
    return { ear, side }
  })
  // the tail, ~ : a thin wave behind
  const tail = new THREE.Group()
  tail.position.set(0.55, -0.45, -0.2)
  const wave = []
  for (let i = 0; i <= 20; i++) wave.push(new THREE.Vector3(i * 0.045, Math.sin(i * 0.6) * 0.08 + i * 0.012, -i * 0.01))
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wave), 48, 0.025, 8), pink))
  body.add(tail)
  for (const side of [-1, 1]) root.add(mesh(smoothSphere, pink, { p: [side * 0.2, -0.82, 0.18], s: [0.11, 0.06, 0.16] }))
  return {
    object: root,
    update: (t) => {
      // always in a hurry: quick little hops, the ears twitching, the tail lashing
      const hopping = Math.max(0, Math.sin(t * 9)) * (Math.sin(t * 0.9) > 0 ? 1 : 0)
      body.position.y = hopping * 0.12
      ears.forEach(({ ear }, k) => (ear.rotation.z = Math.sin(t * 7 + k) * 0.12))
      tail.rotation.y = Math.sin(t * 5) * 0.4
      blinking(eyes, t, 1)
    },
    // its round ears beat like wings, quick; its tail streams behind
    fly: (u, strength, clock) => {
      body.position.y = Math.sin(u * TAU) * 0.05 * strength
      ears.forEach(({ ear, side }) => (ear.rotation.z = side * -(0.2 + Math.sin(u * TAU) * 0.75) * strength))
      tail.rotation.y = Math.sin(clock * 9) * 0.5
      blinking(eyes, clock, 1)
    },
  }
}

// the goblin:   >(o.o)<  big pointed ears sticking out, a big smile;  /#\  two arms, a knitted jumper;  / \  two legs.
// In soft fur like the others; its ears long leaves, pointing out, fringed with fur
export function goblin(): Critter {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const fur = 0xc6ead8
  const tip = 0xffffff
  const onSkin = furredBall(body, { p: [0, 0.38, 0], s: [0.6, 0.52, 0.52], fur, tip, length: 0.15, face: { cy: -0.05, w: 0.72, h: 0.56, colour: 0xe2f6ec } })
  const eyes = [-1, 1].map((side) => eye(body, [side * 0.2, 0.44, onSkin(side * 0.2, 0.44) + 0.02], 0.07))
  body.add(mesh(smoothSphere, glossy(0x9fd8bf), { p: [0, 0.34, onSkin(0, 0.34) + 0.03], s: [0.06, 0.05, 0.05] })) // the .
  body.add(mesh(new THREE.TorusGeometry(0.2, 0.022, 10, 32, Math.PI), ink(0x2b3a6b), { p: [0, 0.27, onSkin(0, 0.27) + 0.01], r: [0.25, 0, Math.PI] })) // the big smile
  // the ears, > and < : long leaves pointing out, a little up, pink inside, a fringe of fur along their top edge
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Group()
    ear.position.set(side * 0.5, 0.45, 0)
    const top = new THREE.QuadraticBezierCurve(new THREE.Vector2(0, 0.14), new THREE.Vector2(side * 0.45, 0.22), new THREE.Vector2(side * 0.9, 0.16))
    const leaf = new THREE.Shape()
    leaf.moveTo(0, -0.14)
    leaf.quadraticCurveTo(side * 0.45, -0.12, side * 0.9, 0.16) // the underside, up to the point
    leaf.quadraticCurveTo(side * 0.45, 0.22, 0, 0.14) // the top edge, back
    leaf.lineTo(0, -0.14)
    const flap = new THREE.ExtrudeGeometry(leaf, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 5, curveSegments: 32 })
    flap.translate(0, 0, -0.025)
    ear.add(new THREE.Mesh(flap, furMaterial(new THREE.MeshStandardMaterial({ color: fur, roughness: 0.9 }), 0)))
    ear.add(mesh(new THREE.ShapeGeometry(leaf, 32), new THREE.MeshStandardMaterial({ color: 0xf6b9c4, roughness: 0.8 }), { p: [side * 0.08, 0.01, 0.07], s: [0.75, 0.6, 1] }))
    for (let k = 0; k <= 8; k++) {
      const v = top.getPoint(k / 8)
      furry(ear, fur, tip, { p: [v.x, v.y, 0], s: [0.06, 0.06, 0.05], length: 0.09, layers: 10 })
    }
    body.add(ear)
    return { ear, side }
  })
  // the jumper, with its # knitted on the front
  body.add(mesh(smoothSphere, glossy(0x4a5cff), { p: [0, -0.32, 0], s: [0.44, 0.4, 0.38] }))
  const stitch = glossy(0xffffff)
  for (const x of [-0.09, 0.09]) body.add(mesh(new THREE.CapsuleGeometry(0.018, 0.3, 4, 8), stitch, { p: [x, -0.3, 0.37] }))
  for (const y of [-0.22, -0.38]) body.add(mesh(new THREE.CapsuleGeometry(0.018, 0.3, 4, 8), stitch, { p: [0, y, 0.36], r: [0, 0, Math.PI / 2] }))
  const legs = furMaterial(glossy(0xb3dfca), 0)
  // its arms, / and \ : the jumper's sleeves, a green hand at the end; pivoting at the shoulders
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.36, -0.16, 0)
    arm.add(mesh(new THREE.CapsuleGeometry(0.075, 0.26, 6, 12), glossy(0x4a5cff), { p: [0, -0.18, 0] }))
    arm.add(mesh(smoothSphere, legs, { p: [0, -0.4, 0.02], s: [0.09, 0.09, 0.09] }))
    arm.rotation.z = side * 0.5
    body.add(arm)
    return { arm, side }
  })
  for (const side of [-1, 1]) {
    root.add(mesh(new THREE.CapsuleGeometry(0.07, 0.26, 6, 12), legs, { p: [side * 0.16, -0.76, 0], r: [0, 0, side * 0.2] }))
    root.add(mesh(smoothSphere, legs, { p: [side * 0.22, -0.95, 0.06], s: [0.12, 0.06, 0.16] }))
  }
  root.position.y = 0.05
  return {
    object: root,
    update: (t) => {
      // a bob, its big ears flapping now and then
      body.position.y = Math.abs(Math.sin(t * 2.4)) * 0.08
      const flap = Math.sin(t * 1.3) > 0.6 ? Math.sin(t * 22) * 0.25 : 0
      ears.forEach(({ ear, side }) => (ear.rotation.z = side * (flap + Math.sin(t * 1.1) * 0.05)))
      // now and then it waves, with its right hand
      const waving = Math.sin(t * 0.7) > 0.5
      arms.forEach(({ arm, side }) => (arm.rotation.z = side > 0 && waving ? 2.4 + Math.sin(t * 10) * 0.35 : side * 0.5))
      blinking(eyes, t, 2)
    },
    // it flies with its big ears, of course, beating them wide
    fly: (u, strength, clock) => {
      body.position.y = Math.sin(u * TAU) * 0.05 * strength
      ears.forEach(({ ear, side }) => (ear.rotation.z = side * Math.sin(u * TAU) * 0.6 * strength))
      // its arms up, as in its jump: \/#\/
      arms.forEach(({ arm, side }) => (arm.rotation.z = side * (0.5 + 1.6 * strength)))
      blinking(eyes, clock, 2)
    },
  }
}
