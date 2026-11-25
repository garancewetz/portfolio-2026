import * as THREE from 'three'

// The pieces of every yeti: the armless yeti of Ruban and the lab, in 3D. A body (head and belly in one), a face (o.o),
// a tuft (:::), two big ears (he holds on and flies with them), two feet. Each version reshapes these pieces.

export type Ear = { pivot: THREE.Group; side: number }
// what the animations move
export type Parts = { root: THREE.Group; body: THREE.Group; eyes: THREE.Object3D[]; ears: Ear[]; feet: THREE.Object3D[] }
// a yeti: its 3D object, its parts, how far its ears turn to lie flat (radians), and its life in its place
export type Yeti = { object: THREE.Group; parts: Parts; flat: number; update: (t: number) => void }
// anything that can fly in the sky (sky.ts): its object, and how it flies at a point of its beat (u: 0…1), beating
// with a `strength` (0: at rest, 1: full), `clock` its own seconds since it took off
export type Flier = { object: THREE.Group; fly: (u: number, strength: number, clock: number) => void }
type Placement = { p?: number[]; s?: number[]; r?: number[] }

export const smoothSphere = new THREE.SphereGeometry(1, 64, 48)

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0] }: Placement = {}) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(p[0], p[1], p[2])
  m.scale.set(s[0], s[1], s[2])
  m.rotation.set(r[0], r[1], r[2])
  return m
}

// the varnish every smooth part is made in
export const glossy = (color: THREE.ColorRepresentation, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25, ...extra })

// the yeti's pieces, from a palette (the versions then dress them in fur, see cast.ts)
export function yeti({ fur, face, belly, ink = 0x141826, inner = 0xf6b9c4 }: { fur: number; face: number; belly: number; ink?: number; inner?: number }): Parts {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  body.add(mesh(smoothSphere, glossy(fur), { s: [0.82, 0.92, 0.78] }))
  // the face, (o.o), and the belly, (   )
  body.add(mesh(smoothSphere, glossy(face), { p: [0, 0.2, 0.56], s: [0.5, 0.36, 0.26] }))
  body.add(mesh(smoothSphere, glossy(belly), { p: [0, -0.36, 0.56], s: [0.44, 0.38, 0.22] }))
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * 0.15, 0.25, 0.8)
    eye.add(mesh(smoothSphere, new THREE.MeshPhysicalMaterial({ color: ink, roughness: 0.15, clearcoat: 1 }), { s: [0.065, 0.085, 0.04] }))
    eye.add(mesh(smoothSphere, new THREE.MeshBasicMaterial({ color: 0xffffff }), { p: [-0.02, 0.03, 0.03], s: [0.02, 0.02, 0.01] }))
    body.add(eye)
    return eye
  })
  body.add(mesh(smoothSphere, glossy(ink), { p: [0, 0.14, 0.82], s: [0.035, 0.03, 0.025] })) // the dot, between the o's
  // the tuft, :::
  for (const [x, lean] of [[-0.1, 0.35], [0, 0], [0.1, -0.35]]) body.add(mesh(new THREE.ConeGeometry(0.06, 0.22, 12), glossy(fur), { p: [x, 0.98, 0], r: [0, 0, lean] }))
  // the ears, (\ and /): pointing up and out, pivoting where they meet the head
  const ears = [-1, 1].map((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.42, 0.62, 0)
    const ear = new THREE.Group()
    ear.add(mesh(smoothSphere, glossy(fur), { p: [side * 0.16, 0.3, 0], s: [0.15, 0.4, 0.1] }))
    ear.add(mesh(smoothSphere, glossy(inner), { p: [side * 0.16, 0.3, 0.06], s: [0.08, 0.28, 0.05] }))
    ear.rotation.z = side * -0.45
    pivot.add(ear)
    body.add(pivot)
    return { pivot, side }
  })
  const feet = [-1, 1].map((side) => {
    const foot = mesh(smoothSphere, glossy(face), { p: [side * 0.24, -0.92, 0.16], s: [0.19, 0.1, 0.26] })
    root.add(foot)
    return foot
  })
  return { root, body, eyes, ears, feet }
}

// in its place: a hop every few seconds (crouch, up, down, land), the ears swaying a little; a blink now and then
export function hop(y: Parts, t: number, offset = 0) {
  const k = ((t + offset) % 3.2) / 3.2
  const air = k > 0.1 && k < 0.5 ? Math.sin(((k - 0.1) / 0.4) * Math.PI) : 0
  const crouch = k < 0.1 ? Math.sin((k / 0.1) * Math.PI) : k > 0.5 && k < 0.6 ? Math.sin(((k - 0.5) / 0.1) * Math.PI) : 0
  y.body.position.y = air * 0.55 - crouch * 0.06
  y.body.scale.set(1 + crouch * 0.06, 1 - crouch * 0.08 + air * 0.04, 1)
  y.feet.forEach((f) => (f.position.y = -0.92 + air * 0.5))
  for (const { pivot, side } of y.ears) pivot.rotation.z = air > 0 ? side * Math.sin(t * 26) * 0.45 : side * Math.sin(t * 1.4) * 0.05
  blink(y, t + offset)
}
export function blink(y: Parts, t: number) {
  const shut = t % 4.3 < 0.14
  y.eyes.forEach((e) => (e.scale.y = shut ? 0.1 : 1))
}
