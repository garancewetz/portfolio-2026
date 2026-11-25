import * as THREE from 'three'
import { furMaterial, furry } from './fur'
import { blink, mesh, type Flier, type Parts, type Yeti } from './parts'

// The ears of the ASCII, (\ and /): a flat side (\) and a round one ((), a fringe of fur along the round one. And how
// they beat when the yeti flies: as the ASCII suggests (raised \\ //, then flat -- --), whipping the air.

type EarColours = { fur: number; tip: number; inner: number; length: number }
const soft = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 })

// an ear from its outline: the flap (in fur), the inside (`lining`: where and how small), the fringe along `along`
function earOf(ear: THREE.Object3D, outline: THREE.Shape, along: (k: number) => THREE.Vector2, lining: { p: number[]; s: number[] }, { fur, tip, inner, length }: EarColours, tufts: number, size: number) {
  const flap = new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 6, curveSegments: 48 })
  flap.translate(0, 0, -0.03)
  ear.add(new THREE.Mesh(flap, furMaterial(new THREE.MeshStandardMaterial({ color: fur, roughness: 0.9 }), 0)))
  ear.add(mesh(new THREE.ShapeGeometry(outline, 48), soft(inner), lining))
  for (let k = 0; k <= tufts; k++) {
    const v = along(k / tufts)
    furry(ear, fur, tip, { p: [v.x, v.y, 0], s: [size, size, size * 0.8], length: length * 0.6, layers: 10 })
  }
}

// Yéta's ear: long, nearly upright, leaning out a little; its round side a curve back down to the head
export function longEar(ear: THREE.Object3D, side: number, colours: EarColours) {
  const tipAt = new THREE.Vector2(side * 0.06, 0.86)
  const bulge = new THREE.Vector2(side * 0.44, 0.6)
  const foot = new THREE.Vector2(side * 0.3, 0.02)
  const outline = new THREE.Shape()
  outline.moveTo(0, 0)
  outline.lineTo(tipAt.x, tipAt.y)
  outline.quadraticCurveTo(bulge.x, bulge.y, foot.x, foot.y)
  outline.lineTo(0, 0)
  const edge = new THREE.QuadraticBezierCurve(tipAt, bulge, foot)
  earOf(ear, outline, (k) => edge.getPoint(k), { p: [side * 0.05, 0.1, 0.085], s: [0.72, 0.78, 1] }, colours, 7, 0.075)
  ear.rotation.z = side * -0.32
}

// Yétou's ear, cell by cell from the ASCII: a short half circle on a top corner, raised (about 55° above flat)
export const ASCII_EAR_UP = 0.96
export function asciiEar(side: number, colours: EarColours) {
  const ear = new THREE.Group()
  const D = 0.78
  const r = D / 2
  // the diameter along the ear (the flat side), the half circle on the side that faces out and down once raised
  const outline = new THREE.Shape()
  outline.moveTo(0, 0)
  outline.lineTo(side * D, 0)
  outline.absarc(side * r, 0, r, side > 0 ? 0 : Math.PI, side > 0 ? -Math.PI : 2 * Math.PI, side > 0)
  const along = (k: number) => new THREE.Vector2(side * (r + r * Math.cos(-Math.PI * k)), r * Math.sin(-Math.PI * k))
  earOf(ear, outline, along, { p: [side * 0.1, -0.05, 0.085], s: [0.72, 0.72, 1] }, colours, 10, 0.08)
  ear.rotation.z = side * ASCII_EAR_UP
  return ear
}

// a wingbeat (u: 0…1 along one beat): the ears come down fast, turning their flat face to the air (they push it), and
// go back up slowly, edge first; the body is lifted by each stroke
function wingbeat(u: number) {
  const down = 0.38
  const ease = (x: number) => x * x * (3 - 2 * x)
  if (u < down) {
    const x = u / down
    return { f: 1.15 * ease(x), twist: Math.sin(Math.PI * x) * 0.95, lift: Math.sin(Math.PI * x) * 0.07 }
  }
  const x = (u - down) / (1 - down)
  return { f: 1.15 * (1 - ease(x)), twist: -Math.sin(Math.PI * x) * 0.3, lift: -Math.sin(Math.PI * x) * 0.03 }
}
const Z = new THREE.Vector3(0, 0, 1)
// each ear's long axis, in its pivot's frame (the twist turns the ear around it)
export function earAxes(parts: Parts) {
  parts.root.updateMatrixWorld(true)
  return parts.ears.map(({ pivot }) => {
    const centre = new THREE.Box3().setFromObject(pivot.children[0]).getCenter(new THREE.Vector3())
    return pivot.worldToLocal(centre).setZ(0).normalize()
  })
}
// the ears at a point of the beat: lowered by `flat` (radians to lie flat), twisted around their own axis; returns
// how much the stroke lifts the body
export function beatEars(parts: Parts, axes: THREE.Vector3[], flat: number, u: number, strength = 1) {
  const w = wingbeat(u)
  parts.ears.forEach(({ pivot, side }, i) => {
    pivot.quaternion.setFromAxisAngle(Z, -side * flat * w.f * strength).multiply(new THREE.Quaternion().setFromAxisAngle(axes[i], side * w.twist * strength))
  })
  return w.lift * strength
}

// a yeti in the sky: its ears beat the air, each stroke lifting its body; its feet dangle; it blinks
export function yetiFlier(y: Yeti): Flier {
  const axes = earAxes(y.parts)
  return {
    object: y.object,
    fly: (u, strength, clock) => {
      y.parts.body.position.y = beatEars(y.parts, axes, y.flat, u, strength)
      y.parts.feet.forEach((foot, n) => {
        foot.position.y = -0.92 + Math.sin(clock * 3 + n) * 0.03
        foot.rotation.x = (0.3 + Math.sin(clock * 2 + n) * 0.12) * strength
      })
      blink(y.parts, clock)
    },
  }
}
