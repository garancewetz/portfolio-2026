import * as THREE from 'three'
import { mesh } from './parts'

// The fur: soft and airy. Shells, layers of the same shape, a little larger each time and sparser and paler towards
// the tips (dense at the root, wispy at the end), combed down a little. Where the face is, no fur grows: the face is
// the skin itself, framed by the fur (seen from the side, the fur hides it). The fur can be dyed.

type Hole = (x: number, y: number, z: number) => boolean

// the strands: dots of light on black, read as transparency (alphaMap); no mipmaps: shrunk for a small picture, the
// strands were averaged to almost nothing and the fur vanished
const strands = (() => {
  const canvas = Object.assign(document.createElement('canvas'), { width: 256, height: 256 })
  const c = canvas.getContext('2d')!
  c.fillStyle = '#000'
  c.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 5200; i++) {
    const v = 120 + Math.random() * 135
    c.fillStyle = `rgb(${v},${v},${v})`
    c.beginPath()
    c.arc(Math.random() * 256, Math.random() * 256, 0.6 + Math.random() * 1.3, 0, Math.PI * 2)
    c.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 5)
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  return texture
})()
// (fine enough that the opening of the face has a smooth edge)
const furBase = new THREE.SphereGeometry(1, 72, 48)

// the triangles of a unit sphere for which `keep` holds (by their centre)
function trianglesWhere(geometry: THREE.BufferGeometry, keep: Hole) {
  const from = geometry.toNonIndexed().attributes.position.array as Float32Array
  const kept: number[] = []
  for (let t = 0; t < from.length; t += 9) {
    const cx = (from[t] + from[t + 3] + from[t + 6]) / 3
    const cy = (from[t + 1] + from[t + 4] + from[t + 7]) / 3
    const cz = (from[t + 2] + from[t + 5] + from[t + 8]) / 3
    if (keep(cx, cy, cz)) for (let k = 0; k < 9; k++) kept.push(from[t + k])
  }
  return kept
}

// a shell: the skin grown by h, combed down by `droop`; no fur where `hole` holds; `grow`: how much longer the fur is
// along x, y, z (thicker on the sides than on top makes a tall body round)
// the skin with its hole cut out, once per hole (every shell of a body shares it)
const holed = new WeakMap<Hole, THREE.BufferGeometry>()
function skinWithout(hole: Hole) {
  let g = holed.get(hole)
  if (g) return g
  const kept = trianglesWhere(furBase, (x, y, z) => !hole(x, y, z))
  g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3))
  const uv: number[] = [] // (the same strands pattern)
  for (let k = 0; k < kept.length; k += 3) uv.push(Math.atan2(kept[k], kept[k + 2]) / (Math.PI * 2) + 0.5, Math.acos(Math.max(-1, Math.min(1, kept[k + 1]))) / Math.PI)
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  holed.set(hole, g)
  return g
}
function shell(h: number, droop: number, hole: Hole | null, grow: number[]) {
  const g = (hole ? skinWithout(hole) : furBase).clone()
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + h * grow[0]), p.getY(i) * (1 + h * grow[1]) - droop, p.getZ(i) * (1 + h * grow[2]))
  g.computeVertexNormals()
  return g
}

// a fur material keeps how far along the hair it is (0: the skin, 1: the tips) and its own colour, for dye
export function furMaterial<M extends THREE.MeshStandardMaterial>(m: M, k: number) {
  m.userData.fur = k
  m.userData.own = m.color.clone()
  return m
}
// dye a yeti's fur: null gives it back its own colour; a colour dyes the roots, paling to the tips
export function dye(object: THREE.Object3D, color: string | null) {
  const root = color ? new THREE.Color(color) : null
  const tip = root ? root.clone().lerp(new THREE.Color(0xffffff), 0.3) : null
  object.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
    const k = m?.userData?.fur
    if (k === undefined) return
    m!.color.copy(root && tip ? root.clone().lerp(tip, k) : m!.userData.own)
  })
}

type FurOptions = { p?: number[]; s?: number[]; length?: number; layers?: number; hole?: Hole | null; grow?: number[] }
// a furry ellipsoid: the skin, and the shells over it
export function furry(parent: THREE.Object3D, color: number, tip: number, { p = [0, 0, 0], s = [1, 1, 1], length = 0.14, layers = 18, hole = null, grow = [1, 1, 1] }: FurOptions) {
  const group = new THREE.Group()
  group.position.set(p[0], p[1], p[2])
  group.scale.set(s[0], s[1], s[2])
  group.add(new THREE.Mesh(furBase, furMaterial(new THREE.MeshStandardMaterial({ color, roughness: 1 }), 0)))
  const base = new THREE.Color(color)
  const end = new THREE.Color(tip)
  for (let i = 1; i <= layers; i++) {
    const k = i / layers
    const material = new THREE.MeshStandardMaterial({ color: base.clone().lerp(end, k), roughness: 1, alphaMap: strands, alphaTest: 0.12 + 0.8 * Math.pow(k, 0.7) })
    group.add(new THREE.Mesh(shell(length * k, length * k * k * 0.35, hole, grow), furMaterial(material, k)))
  }
  parent.add(group)
  return group
}

// the face as the skin itself, where the fur opens: the part of the body's surface (a unit sphere at p, scaled s)
// where `onFace` holds, a hair above it
export function faceCap(onFace: Hole, p: number[], s: number[], color: number) {
  const sphere = new THREE.SphereGeometry(1, 160, 120)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(trianglesWhere(sphere, onFace), 3))
  sphere.dispose()
  g.computeVertexNormals()
  return mesh(g, new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.3 }), { p, s: s.map((v) => v * 1.004) })
}
