import * as THREE from 'three'
import { longEar } from './ears'
import { faceCap, furry } from './fur'
import { hop, yeti, type Yeti } from './parts'

// Yéta: the yeti as an egg in soft pale blue fur, with long ears (the other yeti, Yétou, is built on the ASCII:
// ascii-yeti.ts). Its face is the skin where the fur opens; seen from the side, the fur hides it.

const faceOf = (x: number, y: number, z: number) => z > 0 && (x / 0.58) ** 2 + ((y - 0.22) / 0.37) ** 2 < 1

export function eggYeti(): Yeti {
  const fur = 0xd9e0ff
  const tip = 0xffffff
  const length = 0.17
  const y = yeti({ fur, face: 0x9fb4f0, belly: 0xffffff })
  const [skin, face, belly, ...rest] = y.body.children
  skin.visible = face.visible = belly.visible = false
  const S = [0.82, 0.92, 0.78]
  furry(y.body, fur, tip, { s: S, length, layers: 18, hole: faceOf })
  y.body.add(faceCap(faceOf, [0, 0, 0], S, 0x9fb4f0))
  // its own tuft (cones) made soft; the eyes and the dot laid on the skin
  const onSkin = (x: number, yy: number) => S[2] * Math.sqrt(Math.max(0, 1 - (x / S[0]) ** 2 - (yy / S[1]) ** 2))
  for (const part of rest) {
    if ((part as THREE.Mesh).geometry?.type === 'ConeGeometry') part.visible = false
    else if (part.position.z > 0.4) part.position.z = onSkin(part.position.x, part.position.y) + 0.015
  }
  for (const [x, yy] of [[-0.12, 0.95], [0, 1.0], [0.12, 0.95]]) furry(y.body, fur, tip, { p: [x, yy, 0], s: [0.08, 0.12, 0.08], length: length * 0.8, layers: 10 })
  for (const { pivot, side } of y.ears) {
    const ear = pivot.children[0]
    ear.clear()
    ear.rotation.z = 0
    pivot.position.set(side * 0.24, 0.58, 0)
    longEar(ear, side, { fur, tip, inner: 0xf6b9c4, length })
    ear.scale.setScalar(1.25)
  }
  y.root.position.y = -0.2 // (a little lower: the big ears stay in the frame when it jumps)
  return { object: y.root, parts: y, flat: 1.25, update: (t) => hop(y, t, 2.4) }
}
