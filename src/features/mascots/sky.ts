import * as THREE from 'three'
import type { Flier } from './parts'
import { fit, studio, type Home } from './stage'

// The sky: a canvas over the whole page (clicks go through it), where the freed creatures fly. Each has a goal, a point of
// the sky it heads for, changed every few seconds; it steers towards it at its own speed, slows down as it gets near,
// keeps clear of the others; it turns to face where it goes (never its back to us), banks into its turns, raises its
// nose to climb; its ears beat harder and faster to climb, softly when it glides down. Measured in seconds, not in
// frames: the same on every screen. Every creature of the sky is built and drawn once on arrival, out of sight:
// freeing one costs nothing at the click.

const MAX_SPEED = 2.4
const STEER = 1.6
const ease = (x: number) => x * x * (3 - 2 * x)
const smoothTo = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt))
type Place = { at: THREE.Vector3; scale: number; turn: number }
type Flyer = {
  piece: Flier; holder: THREE.Group; phase: number; rate: number; speed: number
  clock: number; beat: number; heading: number; pos: THREE.Vector3; vel: THREE.Vector3; goal: THREE.Vector3; goalUntil: number
  place: () => Place; going: boolean; since: number; from: THREE.Vector3; fromScale: number; landed: () => void
}

export function sky(builds: (() => Flier)[]) {
  const canvas = Object.assign(document.createElement('canvas'), { className: 'mascots-sky' })
  document.body.append(canvas)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  const scene = studio(renderer)
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  // (measured on the canvas itself: the page's width without its scroll bar, the height the phone really shows)
  const width = () => canvas.clientWidth || innerWidth
  const height = () => canvas.clientHeight || innerHeight
  const resize = () => fit(renderer, camera, width(), height())
  camera.position.set(0, 0, 16)
  const span = () => {
    const y = Math.tan((20 * Math.PI) / 180) * 16
    return { x: y * camera.aspect, y }
  }
  // a point of the screen (px) on the plane where they fly
  const toWorld = (px: number, py: number) => new THREE.Vector3(((px / width()) * 2 - 1) * span().x, (1 - (py / height()) * 2) * span().y, 0)
  const newGoal = (f: Flyer) => {
    const s = span()
    f.goal.set((Math.random() * 2 - 1) * s.x * 0.78, (Math.random() * 2 - 1) * s.y * 0.62, Math.random() * 4 - 2.8)
    f.goalUntil = f.clock + 3 + Math.random() * 4
  }
  const flyers = new Set<Flyer>()

  function fly(f: Flyer, dt: number) {
    const home = f.place()
    // a moment in place, the ears starting to beat, then it takes off, steering towards its goal
    const awake = Math.min(1, f.clock / 0.35)
    if (f.clock > 0.35) {
      if (f.clock > f.goalUntil || f.pos.distanceTo(f.goal) < 0.6) newGoal(f)
      const wanted = f.goal.clone().sub(f.pos)
      wanted.setLength(Math.min(f.speed, wanted.length() * 0.9)) // slower as it arrives
      for (const o of flyers) {
        if (o === f || o.going) continue
        const away = f.pos.clone().sub(o.pos)
        const gap = away.length()
        if (gap < 3.4 && gap > 0.001) wanted.add(away.setLength((3.4 - gap) * 1.6)) // keeps clear of the others
      }
      f.vel.add(wanted.sub(f.vel).multiplyScalar(Math.min(1, STEER * dt)))
      f.pos.addScaledVector(f.vel, dt)
    }
    f.holder.position.copy(f.pos)
    f.holder.scale.setScalar(home.scale + (0.8 - home.scale) * ease(Math.min(1, Math.max(0, (f.clock - 0.35) / 1.6))))
    const speed = Math.hypot(f.vel.x, f.vel.z)
    const heading = Math.atan2(f.vel.x, Math.abs(f.vel.z) + 0.9)
    const turnRate = (heading - f.heading) / dt
    f.heading = heading
    // (never more than about 50°: we always see a little of its face)
    f.holder.rotation.y = smoothTo(f.holder.rotation.y, Math.max(-0.85, Math.min(0.85, heading * 1.2 * Math.min(1, speed))), 4, dt)
    f.holder.rotation.z = smoothTo(f.holder.rotation.z, Math.max(-0.5, Math.min(0.5, -turnRate * 0.35)), 3, dt)
    f.holder.rotation.x = smoothTo(f.holder.rotation.x, -f.vel.y * 0.18, 3, dt)
    const climb = Math.max(-1, Math.min(1, f.vel.y / MAX_SPEED))
    f.beat += dt * f.rate * (1 + 0.45 * climb)
    // its own way of flying (ears, wings, arms, tail…), harder to climb, softer to glide down
    f.piece.fly(f.beat % 1, awake * (0.62 + 0.38 * Math.max(climb, 0) - 0.3 * Math.max(-climb, 0)), f.clock + f.phase)
  }
  // the way back: from where it is to its place, shrinking to its size there; then it lands in it
  function land(f: Flyer, t: number, dt: number) {
    const home = f.place()
    const e = ease(Math.min(1, (t - f.since) / 1.6))
    if (e >= 1) {
      f.holder.visible = false
      flyers.delete(f)
      f.landed()
      return
    }
    f.holder.position.copy(f.from).lerp(home.at, e)
    f.holder.scale.setScalar(f.fromScale + (home.scale - f.fromScale) * e)
    const r = f.holder.rotation
    r.set(smoothTo(r.x, 0, 6, dt), smoothTo(r.y, home.turn, 6, dt), smoothTo(r.z, 0, 6, dt))
    f.beat += dt * f.rate
    f.piece.fly(f.beat % 1, 1 - e, f.clock + f.phase)
  }

  let running = false
  let previous = 0
  const render = (now: number) => {
    const t = now / 1000
    const dt = Math.min(0.05, previous ? t - previous : 0.016)
    previous = t
    resize()
    for (const f of flyers) {
      f.clock += dt
      if (f.going) land(f, t, dt)
      else fly(f, dt)
    }
    renderer.render(scene, camera)
    running = flyers.size > 0
    if (running) requestAnimationFrame(render)
    else previous = 0
  }
  const wake = () => {
    resize()
    if (running) return
    running = true
    requestAnimationFrame(render)
  }

  const ready = builds.map((build, i) => {
    const piece = build()
    const holder = new THREE.Group()
    holder.add(piece.object)
    holder.position.set(0, 0, -60)
    scene.add(holder)
    return { piece, holder, phase: i * 1.7 }
  })
  resize()
  renderer.compile(scene, camera)
  renderer.render(scene, camera)
  ready.forEach((f) => (f.holder.visible = false))
  renderer.render(scene, camera)

  function launch(i: number, place: () => Place) {
    const c = place()
    const f: Flyer = Object.assign(ready[i], {
      place, going: false, since: 0, from: c.at.clone(), fromScale: c.scale, landed: () => {},
      clock: 0, beat: 0, heading: 0, pos: c.at.clone(), vel: new THREE.Vector3(0, 0.6, 0), goal: new THREE.Vector3(), goalUntil: 0,
      // each its own pace: a beat a little quicker or slower, a cruising speed of its own
      rate: 2.9 + (i % 3) * 0.3,
      speed: MAX_SPEED * (0.75 + (i % 4) * 0.08),
    })
    f.holder.position.copy(c.at)
    f.holder.scale.setScalar(c.scale)
    f.holder.rotation.set(0, c.turn, 0)
    f.holder.visible = true
    flyers.add(f)
    wake()
    return f
  }

  return {
    piece: (i: number) => ready[i].piece,
    // free the creature of place i (its canvas, its stage): it starts exactly where, as big as and turned as it stood
    // in its place, then flies off; returns how to call it back
    free(i: number, placeCanvas: HTMLCanvasElement, home: Home) {
      const place = (): Place => {
        const r = placeCanvas.getBoundingClientRect()
        const ppu = home.pixelsPerUnit()
        // (its place's camera looks a quarter unit above the creature's origin)
        return { at: toWorld(r.left + r.width / 2, r.top + r.height / 2 + 0.25 * ppu), scale: ppu / (height() / (2 * span().y)), turn: home.turn() }
      }
      const f = launch(i, place)
      return (landed: () => void) => Object.assign(f, { going: true, from: f.holder.position.clone(), fromScale: f.holder.scale.x, since: performance.now() / 1000, landed })
    },
    // a creature already out, on another page: it comes in from a side of the screen
    roam(i: number) {
      const s = span()
      const at = new THREE.Vector3((i % 2 ? 1 : -1) * (s.x + 1.5), (Math.random() - 0.3) * s.y, 0)
      launch(i, () => ({ at, scale: 0.8, turn: 0 }))
    },
  }
}
