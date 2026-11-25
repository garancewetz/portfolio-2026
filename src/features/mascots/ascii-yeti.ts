import * as THREE from 'three'
import { ASCII_EAR_UP, asciiEar, beatEars, earAxes } from './ears'
import { faceCap, furry } from './fur'
import { hop, mesh, smoothSphere, type Yeti } from './parts'

// Yétou: the yeti built on the ASCII itself, cell by cell (a character is about .3 wide, a line .5 high):
//  (\.:::./)    the ears: short half circles on the top corners, the flat side \ inside, the round ( outside,
//   :(o.o):     raised; between them the tuft ::: ; the face (o.o) a wide opening in the fur, its eyes the o's, its
//   :(   ):     dot the . ; the colons, the fur on his sides: head and belly one block, wider than tall, in so much
//    '' ''      fur that it is nearly round; two feet of two toes each.
export function asciiYeti(): Yeti {
  const fur = 0xd9e0ff
  const tip = 0xffffff
  const length = 0.3
  const faceColour = 0x9fb4f0
  const root = new THREE.Group()
  const body = new THREE.Group()
  const core = new THREE.Group()
  root.add(body)
  body.add(core)
  core.position.y = -0.04 // (the block sits on its feet)
  const S = [1.0, 0.84, 0.8]
  const onFace = (x: number, y: number, z: number) => z > 0 && (x / 0.6) ** 2 + ((y - 0.32) / 0.36) ** 2 < 1 // (o.o), on the top row
  furry(core, fur, tip, { s: S, length, layers: 30, hole: onFace, grow: [0.6, 1.5, 1.0] })
  core.add(faceCap(onFace, [0, 0, 0], S, faceColour))
  const onSkin = (x: number, y: number) => S[2] * Math.sqrt(Math.max(0, 1 - (x / S[0]) ** 2 - (y / S[1]) ** 2))
  const shiny = (c: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1 })
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * 0.3, 0.25, onSkin(side * 0.3, 0.25) + 0.015)
    eye.add(mesh(smoothSphere, shiny(0x10131c), { s: [0.075, 0.09, 0.04] }))
    eye.add(mesh(smoothSphere, new THREE.MeshBasicMaterial({ color: 0xffffff }), { p: [-0.025, 0.035, 0.03], s: [0.022, 0.022, 0.01] }))
    core.add(eye)
    return eye
  })
  core.add(mesh(smoothSphere, shiny(0x141826), { p: [0, 0.17, onSkin(0, 0.17) + 0.015], s: [0.035, 0.03, 0.02] })) // the .
  for (const x of [-0.3, 0, 0.3]) furry(core, fur, tip, { p: [x, 1.0, 0], s: [0.07, 0.13, 0.07], length: length * 0.6, layers: 10 }) // :::
  const ears = [-1, 1].map((side) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.66, 0.62, 0) // (on the top corners, against the head)
    pivot.add(asciiEar(side, { fur, tip, inner: 0xf6b9c4, length }))
    core.add(pivot)
    return { pivot, side }
  })
  // two feet of two toes each: '' ''
  const feet = [-1, 1].map((side) => {
    const foot = new THREE.Group()
    foot.position.set(side * 0.4, -0.92, 0.2)
    for (const dx of [-0.075, 0.075]) foot.add(mesh(smoothSphere, new THREE.MeshPhysicalMaterial({ color: faceColour, roughness: 0.4, clearcoat: 0.6 }), { p: [dx, 0, 0], s: [0.07, 0.08, 0.14] }))
    root.add(foot)
    return foot
  })
  const parts = { root, body, eyes, ears, feet }
  root.position.y = -0.1
  const axes = earAxes(parts)
  return {
    object: root,
    parts,
    flat: ASCII_EAR_UP,
    // a hop, as the others; in the air his ears beat (see beatEars), on the ground they rest raised
    update: (t) => {
      hop(parts, t, 3.1)
      const k = ((t + 3.1) % 3.2) / 3.2
      if (k > 0.1 && k < 0.5) beatEars(parts, axes, ASCII_EAR_UP, (t * 3.2) % 1)
      else for (const { pivot } of ears) pivot.quaternion.identity()
    },
  }
}
