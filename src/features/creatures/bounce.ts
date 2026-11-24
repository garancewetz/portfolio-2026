import type { Creature, Pose } from './art'

// A creature on its string: it sleeps; on hover, it wakes up and bounces like on a trampoline. A ball on a
// spring (the string): z, its height above the string at rest (negative: the string sinks under its weight,
// or under its landing). Hovered, it « pumps » (it pushes on the string as the string comes back up): the
// jumps grow little by little. Left alone, they die down, it settles, and falls asleep again a bit later.

const G = 1900 // gravity (px/s²)
const K = 210 // the string's stiffness
const DAMP = 3.2 // how much the string damps
const PUSH = 3600 // its push, wide awake
const TOP = 950 // the speed of a jump, at most (px/s)
const SLEEPY = 1.4 // settled and calm for this many seconds: it falls asleep again

export interface Bouncer {
  c: Creature
  /** its eyes closed, huddled on its string */
  sleep: Pose
  z: number
  vz: number
  /** the dip in the string, while it is in the air (it springs back, quivering) */
  s: number
  sv: number
  /** its wakefulness: from 0, asleep, to 1, wide awake (it rises gently, and comes down even more slowly) */
  e: number
  awake: boolean
  hover: boolean
  calm: number
}

// eyes closed: the crouching pose, eyes as dashes
const shut = (p: Pose) =>
  p.map((l) =>
    l.replace(/o\.o|\^\.\^/, '-.-').replace('O,O', '-,-').replace('o_o', '-_-').replace('o o', '- -'),
  )

export function bouncer(c: Creature): Bouncer {
  // (at rest, the string sinks just as much as its weight asks)
  return { c, sleep: shut(c.crouch), z: -G / K, vz: 0, s: G / K, sv: 0, e: 0, awake: false, hover: false, calm: 0 }
}

// one time step; returns whether it still moves (otherwise, nothing to redraw)
export function step(b: Bouncer, dt: number) {
  b.e += ((b.hover ? 1 : 0) - b.e) * Math.min(1, dt * (b.hover ? 1.6 : 0.9))
  let a = -G
  if (b.z <= 0) {
    // on the string: it stretches it, the string throws it back; awake, it pushes as the string comes back up (or
    // at rest: that is where it all starts)
    a += -K * b.z - DAMP * b.vz
    if (b.vz >= 0) a += PUSH * b.e
  }
  b.vz = Math.min(TOP, b.vz + a * dt)
  b.z += b.vz * dt
  // the string: under it, it follows; with it in the air, it springs back, quivering
  if (b.z > 0) {
    b.sv += (-600 * b.s - 60 * b.sv) * dt
    b.s += b.sv * dt
  } else {
    b.s = -b.z
    b.sv = -b.vz
  }
  if (b.hover) {
    b.awake = true
    b.calm = 0
  } else if (b.awake && Math.abs(b.vz) < 12 && b.z < 2 && b.e < 0.05) {
    b.calm += dt
    if (b.calm > SLEEPY) b.awake = false
  }
  return b.awake || Math.abs(b.vz) > 1 || Math.abs(b.sv) > 1
}

// its pose: asleep; in the air; sunk into the string (crouching); at rest, awake
export const pose = (b: Bouncer): Pose =>
  !b.awake ? b.sleep : b.z > 10 ? b.c.jump : b.z < -6 ? b.c.crouch : b.c.idle
