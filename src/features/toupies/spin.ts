import * as THREE from 'three'
import { VARIANTS, type Variant } from './motifs'
import { lightPool } from './pool'
import { top } from './top'

// A top and its life: the plunger (press, the twisted rod goes down and makes it spin; release, it comes back
// up), the speed dropping, the end (it wobbles more and more, faster and faster, rattles, and falls on the side
// it was leaning; at rest, it lies down; one pump stands it back up), the sliding on the page (the arrows or the
// slope push it, but only if it spins: lying down or stopped, it no longer moves), the pattern blending into one
// colour when it spins fast.

const DEPTH = 0.32
// the table: its height (all the tops stand on it)
export const FLOOR = -0.92
// how long the eye holds the light (persistence of vision): a twenty-fifth of a second
const EYE = 1 / 25
// the speed the top loses per second; and how much the page brakes its sliding
const LOSS = 0.3
const GLIDE = 0.6
const UP = new THREE.Vector3(0, 1, 0)

export function spinner(variant: Variant, x0: number, z0: number) {
  const body = top(variant)
  // from the centre to the tip, and the radius of its rim; lying down, the tip and the rim touch the table: the
  // axis tilts by that much
  const LYING = Math.atan2(body.tip, body.rim)
  const max = VARIANTS[variant].max
  // the pool of light, on the page, under the light-up top (a soft patch, changing colour)
  const pool = VARIANTS[variant].kind === 'lampes' ? lightPool() : null
  const wobble = new THREE.Group()
  // (the plunger does not turn: its twisted rod turns the body, as on the real toy)
  wobble.add(body.group, body.plunger)
  const tipped = new THREE.Quaternion()
  const shake = new THREE.Quaternion()
  const axis = new THREE.Vector3()
  const up = new THREE.Vector3()
  const lean = new THREE.Euler()
  const t = {
    variant,
    wobble,
    rim: body.rim,
    tip: body.tip,
    pool: pool?.mesh ?? null,
    pressed: false,
    // the arrows' push (from -1 to 1, across width and depth), the position and the speed on the page
    pushX: 0,
    pushZ: 0,
    x: x0,
    z: z0,
    // (its place on the previous frame: an edge sends it back there, see bump.ts)
    px: x0,
    pz: z0,
    vx: 0,
    vz: 0,
    angle: Math.random() * 6.28,
    omega: 0,
    depth: 0,
    spring: 0,
    fall: 1,
    fallSpeed: 0,
    side: Math.random() * Math.PI * 2,
    phase: 0,
    chatter: 0,
    // slope: the page's slope (the phone tilted, see tilt.ts)
    step(dt: number, slope = { x: 0, z: 0 }) {
      // the plunger: it goes down when pressed (and launches the top on the way down), comes back up on a spring
      const was = t.depth
      const { plunger, group, tip, rim } = body
      if (t.pressed) {
        t.depth = Math.min(1, t.depth + dt * 3.2)
        t.spring = 0
      } else {
        t.spring = t.spring * Math.exp(-dt * 9) - t.depth * dt * 60
        t.depth = Math.max(0, t.depth + t.spring * dt)
      }
      // (one full pump: about five more turns per second; a real pump top goes up to fifteen or twenty)
      if (t.depth > was) t.omega = Math.min(max, t.omega + (t.depth - was) * 32)
      plunger.position.y = -t.depth * DEPTH
      t.angle += t.omega * dt
      // (it slows down slowly; almost stopped, it stops completely)
      t.omega *= Math.exp(-dt * (t.omega < 0.4 ? 2 : LOSS))
      const s = t.omega
      // the wobble: none when it spins fast; slowing down, its axis tilts more and more and circles faster and faster
      // (precession goes as the inverse of the speed, as on a real top)
      const tilt = 0.42 * (1 - Math.min(1, s / 14)) ** 2
      t.phase += dt * (1.2 + 14 / (s + 1))
      lean.set(tilt * Math.cos(t.phase), 0, tilt * Math.sin(t.phase))
      // falling, or standing back up
      if (t.pressed || s > 1.2) {
        t.fall = Math.max(0, t.fall - dt * 3.5)
        t.fallSpeed = 0
      } else if (s < 0.6) {
        // (it falls on the side it was leaning, starting from where it was)
        if (t.fall === 0) {
          up.copy(UP).applyEuler(lean)
          t.side = Math.atan2(up.x, up.z)
          t.fall = tilt / LYING
        }
        t.fallSpeed += dt * 3.5
        t.fall += t.fallSpeed * dt
        if (t.fall > 1) {
          t.fall = 1
          t.fallSpeed = Math.abs(t.fallSpeed) > 0.4 ? -t.fallSpeed * 0.25 : 0
        }
      }
      // the sliding: the arrows (and the slope) push the harder the faster it spins (lying down, not at all); on its
      // tip, it slides well, lying down it rubs and stops
      const drive = Math.min(1, s / 6) * (1 - t.fall)
      t.vx += (t.pushX * 7 + slope.x * 9) * drive * dt
      t.vz += (t.pushZ * 7 + slope.z * 9) * drive * dt
      const grip = Math.exp(-dt * (GLIDE + 4 * t.fall))
      t.vx *= grip
      t.vz *= grip
      t.px = t.x
      t.pz = t.z
      t.x += t.vx * dt
      t.z += t.vz * dt
      // (while falling, the wobble fades: the fall carries it on)
      const theta = t.fall * LYING
      axis.set(Math.cos(t.side), 0, -Math.sin(t.side))
      tipped.setFromAxisAngle(axis, theta)
      const keep = Math.max(0, 1 - 2 * t.fall)
      // (and it leans a little towards the side it slides to)
      lean.set(lean.x * keep + t.vz * 0.05, 0, lean.z * keep - t.vx * 0.05)
      shake.setFromEuler(lean)
      wobble.quaternion.copy(tipped).multiply(shake)
      // (it rests on its lowest point: the tip, or the rim when it leans; at the very end, it rattles: the rim hits
      // the table, small quick hops)
      up.copy(UP).applyQuaternion(wobble.quaternion)
      const low = Math.min(-tip * up.y, -rim * Math.sqrt(Math.max(0, 1 - up.y * up.y)))
      t.chatter += dt * 40
      const rattle = 0.014 * Math.min(1, Math.max(0, (3 - s) / 2.4)) * (s > 0.6 ? 1 : 0) * (1 - t.fall)
      wobble.position.set(t.x, FLOOR - low + rattle * Math.abs(Math.sin(t.chatter)), t.z)
      group.rotation.y = t.angle
      // the pattern blends: the share of a turn covered while the eye holds the light
      body.blur(Math.min(1, (s * EYE) / (2 * Math.PI)))
      // the light-up top: its lamps light up with the speed, and light the page around it
      const light = Math.min(1, s / 25) * (1 - t.fall)
      body.glow(light)
      if (pool) {
        pool.mesh.position.set(t.x, FLOOR + 0.01, t.z)
        pool.set(light, t.angle)
      }
    },
    // where its tip is, on the page (for the pencil line, see trace.ts)
    point(out: THREE.Vector3) {
      return out.set(0, -body.tip, 0).applyQuaternion(wobble.quaternion).add(wobble.position)
    },
  }
  return t
}
export type Spinner = ReturnType<typeof spinner>
