import './sky.css'
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
// where one flying is, as fractions of the screen (so that it goes on from there on the next page)
export type Snapshot = { x: number; y: number; z: number; vx: number; vy: number; vz: number; turn: number; scale: number; beat: number }
type Place = { at: THREE.Vector3; scale: number; turn: number }
type Flyer = {
  piece: Flier; holder: THREE.Group; phase: number; rate: number; speed: number
  clock: number; beat: number; heading: number; pos: THREE.Vector3; vel: THREE.Vector3; goal: THREE.Vector3; goalUntil: number
  place: () => Place; fresh: boolean; going: boolean; since: number; trip: number; away: boolean; from: THREE.Vector3; fromScale: number; landed: () => void
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
  // where it heads next: somewhere on the screen, nearer or further; now and then out of it, past a side, where it
  // stays a while before coming back
  const newGoal = (f: Flyer) => {
    const s = span()
    f.away = Math.random() < 0.3
    if (f.away) {
      f.goal.set((Math.random() < 0.5 ? -1 : 1) * s.x * 1.7, (Math.random() * 2 - 1) * s.y * 0.5, Math.random() * 3 - 2)
      f.goalUntil = f.clock + 6 + Math.random() * 6
    } else {
      f.goal.set((Math.random() * 2 - 1) * s.x * 0.78, (Math.random() * 2 - 1) * s.y * 0.62, Math.random() * 4 - 2.8)
      f.goalUntil = f.clock + 3 + Math.random() * 4
    }
  }
  // its first goal, just freed: up and away, into the distance, before it wanders
  const firstGoal = (f: Flyer) => {
    f.away = false
    f.goal.set(f.pos.x * 0.6, span().y * 0.45, -6)
    f.goalUntil = f.clock + 2.5
  }
  const flyers = new Set<Flyer>()

  function fly(f: Flyer, dt: number) {
    // a moment in place, the ears starting to beat, then it takes off, steering towards its goal
    const awake = Math.min(1, f.clock / 0.35)
    if (f.clock > 0.35) {
      if (f.fresh) {
        f.fresh = false
        firstGoal(f)
      } else if (f.clock > f.goalUntil || (!f.away && f.pos.distanceTo(f.goal) < 0.6)) newGoal(f)
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
    // (from its size where it set off to its size in the sky)
    f.holder.scale.setScalar(f.fromScale + (0.8 - f.fromScale) * ease(Math.min(1, Math.max(0, (f.clock - 0.35) / 1.6))))
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
  // the way back: from where it is (coming in from past the edge if it was out) to its place, in an arc, shrinking to
  // its size there; then it lands in it. The further it is, the longer the way.
  function land(f: Flyer, t: number, dt: number) {
    const home = f.place()
    const e = ease(Math.min(1, (t - f.since) / f.trip))
    if (e >= 1) {
      f.holder.visible = false
      flyers.delete(f)
      f.landed()
      return
    }
    f.holder.position.copy(f.from).lerp(home.at, e)
    f.holder.position.y += Math.sin(Math.PI * e) * Math.min(2, f.from.distanceTo(home.at) * 0.15)
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
      place, fresh: false, going: false, since: 0, trip: 1.6, away: false, from: c.at.clone(), fromScale: c.scale, landed: () => {},
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

  // its place in the line (its canvas, its stage): where, how big and how turned it stands there
  const placeOf = (canvas: HTMLCanvasElement, home: Home) => (): Place => {
    const r = canvas.getBoundingClientRect()
    const ppu = home.pixelsPerUnit()
    // (its place's camera looks a quarter unit above the creature's origin)
    return { at: toWorld(r.left + r.width / 2, r.top + r.height / 2 + 0.25 * ppu), scale: ppu / (height() / (2 * span().y)), turn: home.turn() }
  }
  // how to call it back: from where it is to its place
  const recallOf = (f: Flyer) => (landed: () => void) => {
    const from = f.holder.position.clone()
    const trip = Math.max(1.6, Math.min(3.4, from.distanceTo(f.place().at) / 4))
    Object.assign(f, { going: true, from, fromScale: f.holder.scale.x, since: performance.now() / 1000, trip, landed })
  }
  // its place in the line, for one already out that goes on flying but may be called back to it (its canvas, its stage)
  type Back = { canvas: HTMLCanvasElement; home: Home }
  const homing = (f: Flyer, back?: Back) => {
    if (!back) return undefined
    f.place = placeOf(back.canvas, back.home)
    return recallOf(f)
  }

  return {
    piece: (i: number) => ready[i].piece,
    // all gone: the sky emptied, its canvas taken away (the loop stops with no one left to draw)
    clear() {
      flyers.clear()
      canvas.remove()
      renderer.dispose()
    },
    // free the creature of place i: it starts exactly where, as big as and turned as it stood in its place, then flies
    // off; returns how to call it back
    free(i: number, canvas: HTMLCanvasElement, home: Home) {
      const f = launch(i, placeOf(canvas, home))
      f.fresh = true
      return recallOf(f)
    },
    // where one flying is, to go on from there on the next page (null: not flying)
    where(i: number): Snapshot | null {
      const f = ready[i] as Flyer
      if (!flyers.has(f) || f.going) return null
      const s = span()
      const p = f.holder.position
      return { x: p.x / s.x, y: p.y / s.y, z: p.z, vx: f.vel.x, vy: f.vel.y, vz: f.vel.z, turn: f.holder.rotation.y, scale: f.holder.scale.x, beat: f.beat }
    },
    // one that was flying on the previous page: on at once, where it was, as it was going
    resume(i: number, was: Snapshot, back?: Back) {
      const s = span()
      const at = new THREE.Vector3(was.x * s.x, was.y * s.y, was.z)
      const f = launch(i, () => ({ at, scale: was.scale, turn: was.turn }))
      f.vel.set(was.vx, was.vy, was.vz)
      // (past its take-off, full size)
      Object.assign(f, { clock: 2, fromScale: 0.8, beat: was.beat })
      return homing(f, back)
    },
    // one out since a while: it comes in from a side of the screen
    roam(i: number, back?: Back) {
      const s = span()
      const at = new THREE.Vector3((i % 2 ? 1 : -1) * (s.x + 1.5), (Math.random() - 0.3) * s.y, 0)
      const f = launch(i, () => ({ at, scale: 0.8, turn: 0 }))
      return homing(f, back)
    },
  }
}
