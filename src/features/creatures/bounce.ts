import type { Creature, Pose } from './art'

// Une créature sur sa ficelle : elle dort ; au survol, elle se réveille et fait du trampoline. Une balle sur un
// ressort (la ficelle) : z, sa hauteur au-dessus de la ficelle au repos (négative : la ficelle s'enfonce sous son
// poids, ou sous sa réception). Survolée, elle « pompe » (elle pousse sur la ficelle quand celle-ci remonte) : les
// sauts grandissent peu à peu. Laissée, ils s'amortissent, elle se pose, et se rendort un peu plus tard.

const G = 1900 // la pesanteur (px/s²)
const K = 210 // la raideur de la ficelle
const DAMP = 3.2 // ce que la ficelle amortit
const PUSH = 3600 // sa poussée, bien réveillée
const TOP = 950 // la vitesse d'un saut, au plus (px/s)
const SLEEPY = 1.4 // posée et calme depuis tant de secondes : elle se rendort

export interface Bouncer {
  c: Creature
  /** ses yeux fermés, tassée sur sa ficelle */
  sleep: Pose
  z: number
  vz: number
  /** le creux de la ficelle, quand elle est en l'air (elle revient en vibrant) */
  s: number
  sv: number
  /** son réveil : de 0, endormie, à 1, bien réveillée (il monte doucement, et redescend plus lentement encore) */
  e: number
  awake: boolean
  hover: boolean
  calm: number
}

// les yeux fermés : la pose accroupie, les yeux en tirets
const shut = (p: Pose) =>
  p.map((l) =>
    l.replace(/o\.o|\^\.\^/, '-.-').replace('O,O', '-,-').replace('o_o', '-_-').replace('o o', '- -'),
  )

export function bouncer(c: Creature): Bouncer {
  // (au repos, la ficelle s'enfonce juste ce que son poids demande)
  return { c, sleep: shut(c.crouch), z: -G / K, vz: 0, s: G / K, sv: 0, e: 0, awake: false, hover: false, calm: 0 }
}

// un pas de temps ; renvoie si elle bouge encore (sinon, rien à redessiner)
export function step(b: Bouncer, dt: number) {
  b.e += ((b.hover ? 1 : 0) - b.e) * Math.min(1, dt * (b.hover ? 1.6 : 0.9))
  let a = -G
  if (b.z <= 0) {
    // sur la ficelle : elle la tend, la ficelle la renvoie ; réveillée, elle pousse quand la ficelle remonte (ou au
    // repos : c'est là que tout commence)
    a += -K * b.z - DAMP * b.vz
    if (b.vz >= 0) a += PUSH * b.e
  }
  b.vz = Math.min(TOP, b.vz + a * dt)
  b.z += b.vz * dt
  // la ficelle : sous elle, elle suit ; elle en l'air, elle revient en vibrant
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

// sa pose : endormie ; en l'air ; enfoncée dans la ficelle (accroupie) ; au repos, réveillée
export const pose = (b: Bouncer): Pose =>
  !b.awake ? b.sleep : b.z > 10 ? b.c.jump : b.z < -6 ? b.c.crouch : b.c.idle
