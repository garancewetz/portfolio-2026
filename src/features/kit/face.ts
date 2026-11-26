import * as THREE from 'three'
import { INK, frontZ, material, mesh, setEyes, sphere } from './parts'
import { BODY, type Pose } from './pousse'

// Pousse's expressions: what makes each outfit a feeling, not only a prop. Every feature is built once, on the front
// of the body, and a look picks the ones it shows each frame (face.set), so a look can change its mind mid-gesture.

type Eyes = 'round' | 'wide' | 'happy' | 'closed'
type Brows = 'none' | 'worried' | 'focused' | 'raised' | 'curious'
type Mouth = 'smile' | 'grin' | 'o' | 'frown' | 'wavy' | 'flat' | 'none'

// open: the blink (round and wide eyes), left and right for each eye apart; dx, dy: where they look; say: how open the « o » is; blush: pinker cheeks
export type Expression = {
  eyes?: Eyes
  brows?: Brows
  mouth?: Mouth
  open?: number
  left?: number
  right?: number
  dx?: number
  dy?: number
  say?: number
  blush?: boolean
}

// five moods, so a glance says what to do: calm (nothing for you), good news (look when you like), your move (now),
// something wrong (to fix), someone asking (to answer); a look holds its mood for its whole gesture
export const MOOD = {
  calm: {},
  good: { eyes: 'happy', mouth: 'grin', blush: true },
  yourMove: { eyes: 'wide', brows: 'raised', mouth: 'o' },
  wrong: { eyes: 'wide', brows: 'worried', mouth: 'wavy' },
  asking: { brows: 'curious', mouth: 'o', say: 0.6 },
} satisfies Record<string, Expression>

const EYE_X = 0.3
const EYE_Y = 0.13
const onFront = (x: number, y: number, lift = 0.012) => frontZ(BODY, x, y) + lift

// the tilt of each brow (left, right) and its height: worried lifts the inner ends, focused lowers them, curious
// raises one (a positive tilt lifts a stroke's right end)
const BROWS: Record<Exclude<Brows, 'none'>, { tilt: [number, number]; y: [number, number] }> = {
  worried: { tilt: [0.4, -0.4], y: [0.34, 0.34] },
  focused: { tilt: [-0.38, 0.38], y: [0.3, 0.3] },
  raised: { tilt: [-0.12, 0.12], y: [0.41, 0.41] },
  curious: { tilt: [-0.15, 0.3], y: [0.43, 0.33] },
}

export function addFace(pose: Pose) {
  const root = pose.root
  const dark = material(INK, { roughness: 0.3 })

  // eyes drawn as lines: happy (^ ^, an arch) and closed (a smile-shaped curve, asleep)
  const arch = new THREE.TorusGeometry(0.075, 0.019, 8, 24, Math.PI)
  const happy = [-1, 1].map((side) => mesh(arch, dark, { position: [side * EYE_X, EYE_Y - 0.02, onFront(side * EYE_X, EYE_Y)] }))
  const closed = [-1, 1].map((side) => mesh(arch, dark, { position: [side * EYE_X, EYE_Y + 0.03, onFront(side * EYE_X, EYE_Y)], rotation: [0, 0, Math.PI], scale: [1, 0.7, 1] }))
  for (const line of [...happy, ...closed]) root.add(line)

  // the brows: one short stroke above each eye, tilted to say how it feels
  const stroke = new THREE.CapsuleGeometry(0.022, 0.12, 4, 8)
  const brows = [0, 1].map(() => {
    const brow = mesh(stroke, dark)
    root.add(brow)
    return brow
  })

  // the mouths, one shown at a time (the plain smile is the body's own)
  const lips = material(0x3a1f2b, { roughness: 0.6, side: THREE.DoubleSide })
  const grin = new THREE.Group()
  grin.position.set(0, -0.09, onFront(0, -0.14, 0.008))
  grin.add(mesh(new THREE.CircleGeometry(0.15, 32, Math.PI, Math.PI), lips))
  grin.add(mesh(sphere, material(0xff7f8f), { position: [0, -0.1, 0.004], scale: [0.075, 0.04, 0.01] }))
  const o = mesh(sphere, material(0x3a1f2b, { roughness: 0.5 }), { position: [0, -0.15, onFront(0, -0.15, 0)], scale: [0.055, 0.07, 0.02] })
  const frown = mesh(new THREE.TorusGeometry(0.1, 0.02, 12, 32, Math.PI), dark, { position: [0, -0.22, onFront(0, -0.2, 0.005)] })
  const wavyPath = new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, (_, i) => {
      const x = -0.14 + i * 0.035
      return new THREE.Vector3(x, -0.15 + Math.sin((i * Math.PI) / 2) * 0.022, onFront(x, -0.15, 0.005))
    }),
  )
  const wavy = mesh(new THREE.TubeGeometry(wavyPath, 48, 0.017, 8), dark)
  const flat = mesh(new THREE.CapsuleGeometry(0.018, 0.15, 4, 8), dark, { position: [0, -0.15, onFront(0, -0.15, 0.005)], rotation: [0, 0, Math.PI / 2] })
  for (const mouth of [grin, o, frown, wavy, flat]) root.add(mouth)

  // the blush: a pinker, wider glow over the cheeks
  const pinker = material(0xff6f86, { transparent: true, opacity: 0.55, roughness: 0.9, clearcoat: 0 })
  const blush = [-1, 1].map((side) => {
    const cheek = mesh(sphere, pinker, { position: [side * 0.5, -0.1, frontZ(BODY, side * 0.5, -0.1)], scale: [0.17, 0.1, 0.03], rotation: [0, side * 0.6, 0] })
    root.add(cheek)
    return cheek
  })

  return {
    set({ eyes = 'round', brows: feel = 'none', mouth = 'smile', open = 1, left, right, dx = 0, dy = 0, say = 1, blush: pink = false }: Expression = {}) {
      const drawn = eyes === 'round' || eyes === 'wide'
      const size = eyes === 'wide' ? 1.25 : 1
      for (const eye of pose.eyes) {
        eye.visible = drawn
        eye.scale.x = size
      }
      if (drawn) {
        setEyes(pose.eyes, { open, left: left ?? open, right: right ?? open, dx, dy })
        for (const eye of pose.eyes) eye.scale.y *= size
      }
      happy.forEach((line) => (line.visible = eyes === 'happy'))
      closed.forEach((line) => (line.visible = eyes === 'closed'))

      brows.forEach((brow, index) => {
        brow.visible = feel !== 'none'
        if (feel === 'none') return
        const { tilt, y } = BROWS[feel]
        const x = (index === 0 ? -1 : 1) * EYE_X + dx
        brow.position.set(x, y[index] + dy, onFront(x, y[index]))
        brow.rotation.set(0, 0, Math.PI / 2 + tilt[index])
      })

      pose.smile.visible = mouth === 'smile'
      grin.visible = mouth === 'grin'
      o.visible = mouth === 'o'
      o.scale.set(0.055 * (0.8 + say * 0.2), 0.07 * say, 0.02)
      frown.visible = mouth === 'frown'
      wavy.visible = mouth === 'wavy'
      flat.visible = mouth === 'flat'
      blush.forEach((cheek) => (cheek.visible = pink))
    },
  }
}
