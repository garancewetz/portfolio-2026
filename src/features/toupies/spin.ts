import * as THREE from 'three'
import { VARIANTS, type Variant } from './motifs'
import { lightPool } from './pool'
import { top } from './top'

// Une toupie et sa vie : la pompe (on appuie, la tige torsadée s'enfonce et la fait tourner ; on relâche, elle
// remonte), la vitesse qui retombe, la fin (elle vacille de plus en plus, de plus en plus vite, grelotte, et tombe
// du côté où elle penchait ; au repos, elle est couchée ; un coup de pompe la redresse), le glissement sur la page
// (les flèches ou la pente la poussent, mais seulement si elle tourne : couchée ou arrêtée, elle ne bouge plus), le
// motif qui se fond en une couleur quand elle tourne vite.

const DEPTH = 0.32
// la table : sa hauteur (toutes les toupies y sont posées)
export const FLOOR = -0.92
// le temps pendant lequel l'œil garde la lumière (la persistance rétinienne) : un vingt-cinquième de seconde
const EYE = 1 / 25
// le sol (voir ground.ts) : loss, la vitesse que la toupie perd par seconde ; glide, ce qu'il freine son glissement
export const feel = { loss: 0.3, glide: 0.6 }
const UP = new THREE.Vector3(0, 1, 0)

export function spinner(variant: Variant, x0: number, z0: number) {
  const body = top(variant)
  // du centre à la pointe, et le rayon de son bord ; couchée, la pointe et le bord touchent la table : l'axe penche
  // d'autant
  const LYING = Math.atan2(body.tip, body.rim)
  const max = VARIANTS[variant].max
  // la flaque de lumière, sur la page, sous la toupie lumineuse (une tache douce, qui change de couleur)
  const pool = VARIANTS[variant].kind === 'lampes' ? lightPool() : null
  const wobble = new THREE.Group()
  // (la pompe ne tourne pas : c'est sa tige torsadée qui fait tourner le corps, comme sur le vrai jouet)
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
    reflect: body.reflect,
    pressed: false,
    // la poussée des flèches (de -1 à 1, sur la largeur et la profondeur), la place et la vitesse sur la page
    pushX: 0,
    pushZ: 0,
    x: x0,
    z: z0,
    // (sa place à l'image d'avant : un bord la renvoie là, voir bump.ts)
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
    // slope : la pente de la page (le téléphone penché, voir tilt.ts)
    step(dt: number, slope = { x: 0, z: 0 }) {
      // la pompe : elle descend quand on appuie (et lance la toupie en descendant), remonte d'un ressort
      const was = t.depth
      const { plunger, group, tip, rim } = body
      if (t.pressed) {
        t.depth = Math.min(1, t.depth + dt * 3.2)
        t.spring = 0
      } else {
        t.spring = t.spring * Math.exp(-dt * 9) - t.depth * dt * 60
        t.depth = Math.max(0, t.depth + t.spring * dt)
      }
      // (un coup de pompe complet : environ cinq tours par seconde de plus ; une vraie toupie à pompe monte à quinze
      // ou vingt)
      if (t.depth > was) t.omega = Math.min(max, t.omega + (t.depth - was) * 32)
      plunger.position.y = -t.depth * DEPTH
      t.angle += t.omega * dt
      // (elle ralentit lentement ; presque arrêtée, elle s'arrête tout à fait)
      t.omega *= Math.exp(-dt * (t.omega < 0.4 ? 2 : feel.loss))
      const s = t.omega
      // le vacillement : nul quand elle tourne vite ; en ralentissant, son axe penche de plus en plus et décrit son
      // cercle de plus en plus vite (la précession va comme l'inverse de la vitesse, comme sur une vraie toupie)
      const tilt = 0.42 * (1 - Math.min(1, s / 14)) ** 2
      t.phase += dt * (1.2 + 14 / (s + 1))
      lean.set(tilt * Math.cos(t.phase), 0, tilt * Math.sin(t.phase))
      // tomber, ou se redresser
      if (t.pressed || s > 1.2) {
        t.fall = Math.max(0, t.fall - dt * 3.5)
        t.fallSpeed = 0
      } else if (s < 0.6) {
        // (elle tombe du côté où elle penchait, en partant de là où elle en était)
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
      // le glissement : les flèches (et la pente) poussent d'autant plus qu'elle tourne vite (couchée, plus du
      // tout) ; sur sa pointe, elle glisse bien, couchée elle frotte et s'arrête
      const drive = Math.min(1, s / 6) * (1 - t.fall)
      t.vx += (t.pushX * 7 + slope.x * 9) * drive * dt
      t.vz += (t.pushZ * 7 + slope.z * 9) * drive * dt
      const grip = Math.exp(-dt * (feel.glide + 4 * t.fall))
      t.vx *= grip
      t.vz *= grip
      t.px = t.x
      t.pz = t.z
      t.x += t.vx * dt
      t.z += t.vz * dt
      // (en tombant, le vacillement s'efface : c'est la chute qui le continue)
      const theta = t.fall * LYING
      axis.set(Math.cos(t.side), 0, -Math.sin(t.side))
      tipped.setFromAxisAngle(axis, theta)
      const keep = Math.max(0, 1 - 2 * t.fall)
      // (et elle penche un peu du côté où elle glisse)
      lean.set(lean.x * keep + t.vz * 0.05, 0, lean.z * keep - t.vx * 0.05)
      shake.setFromEuler(lean)
      wobble.quaternion.copy(tipped).multiply(shake)
      // (elle repose sur son point le plus bas : la pointe, ou le rebord quand elle penche ; à la toute fin, elle
      // grelotte : le rebord frappe la table, petits sauts rapides)
      up.copy(UP).applyQuaternion(wobble.quaternion)
      const low = Math.min(-tip * up.y, -rim * Math.sqrt(Math.max(0, 1 - up.y * up.y)))
      t.chatter += dt * 40
      const rattle = 0.014 * Math.min(1, Math.max(0, (3 - s) / 2.4)) * (s > 0.6 ? 1 : 0) * (1 - t.fall)
      wobble.position.set(t.x, FLOOR - low + rattle * Math.abs(Math.sin(t.chatter)), t.z)
      group.rotation.y = t.angle
      // le motif se fond : la portion de tour parcourue pendant que l'œil garde la lumière
      body.blur(Math.min(1, (s * EYE) / (2 * Math.PI)))
      // la toupie lumineuse : ses lampes s'allument avec la vitesse, et éclairent la page autour d'elle
      const light = Math.min(1, s / 25) * (1 - t.fall)
      body.glow(light)
      if (pool) {
        pool.mesh.position.set(t.x, FLOOR + 0.01, t.z)
        pool.set(light, t.angle)
      }
    },
    // où est sa pointe, sur la page (pour le trait de crayon, voir trace.ts)
    point(out: THREE.Vector3) {
      return out.set(0, -body.tip, 0).applyQuaternion(wobble.quaternion).add(wobble.position)
    },
  }
  return t
}
export type Spinner = ReturnType<typeof spinner>
