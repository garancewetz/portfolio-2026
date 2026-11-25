import type { Sprite } from '@/features/escalade/sprites'
import { BRACE, CLIMB, FALL, FLY, HANG, RISE, SLEEP, SLIDE, STAND, WALK } from './yeti'
import type { Ribbons, Stroke } from './ribbon'

// The little yeti (see yeti.ts): he walks on the ribbon, to the right, and behaves like a real little
// climber.
// - When the ribbon goes down, he slides, faster; too steep, he cannot hold on: he comes off, and falls, or
//   bounces lower on the same ribbon.
// - When it goes up, he struggles; steep (a glissando upwards), he climbs, flapping his ears, at his own pace. He
//   falls behind; when it is easy (flat, a descent), he hurries to get back to his place.
// - At the end of a ribbon (a silence), he waits at the edge: on flat ground, standing; on a slope, crouching,
//   ears flat; if it goes down too much, he slides, and goes off into the void. As soon as another ribbon starts,
//   he jumps the gap; sometimes a little short: then he catches the edge with his ears, hangs for a moment, and
//   pulls himself up.
// - When he falls (not when he jumps), he flaps his ears very fast: he flies, and comes down gently.
// - Falling, if he passes within reach of a ribbon (the thread between his feet and his ears), he grabs it too.
// - If he leaves the page (carried off to the left, or fallen at the bottom), he drops from the sky onto the
//   ribbon being sung. Stopped for a long time, he falls asleep.

const FONT = `500 11px 'JetBrains Mono', ui-monospace, monospace`
const LINE = 11
// gravity (pixels per second, per second)
const GRAVITY = 1900
// flying (he flaps his ears), he does not come down faster than that (pixels per second)
const FLUTTER = 240
// the slopes (in pixels of height per pixel forward; downwards: positive): from which he climbs, at which he
// comes off going down, and at which he no longer holds at the edge; his climbing speed (in height, a share of
// his stride)
const STEEP = 1
const SLIP = 4
const EDGE = 1.2
const CLIMB_RATE = 1
// his place on the page (a share of the width up to the ribbon's head): behind, he hurries (up to almost twice
// as fast); ahead, he slows down a little
const HOME = 0.55
// hanging: his ears on the thread, his feet below; how long he hangs, then how long he takes to pull himself up
const HANG_DROP = 3 * LINE + 9
const DANGLE = 0.35
const HOIST = 0.5
// his ears, above his feet, when he falls (what he can catch)
const REACH = 3 * LINE + 4

type Mode = 'ride' | 'air' | 'hang' | 'gone'

export function rider() {
  // x: in the world (like the ribbon's points); y: his feet, on the page; hung: since when he has been hanging
  const me = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mode: 'gone' as Mode,
    on: null as Stroke | null,
    speed: 0,
    idle: 0,
    step: 0,
    hung: 0,
    flap: 0,
    fly: false,
  }
  let pose: Sprite = STAND
  const walking = (by: number) => WALK[Math.floor((me.step += by) / 9) % WALK.length]

  return {
    // walk: his stride (the scrolling, in pixels per second); screenX: where he is on the
    // page; headX: where the ribbon is born; yOf: the height of a note
    step(
      dt: number,
      ribbon: Ribbons,
      walk: number,
      screenX: (x: number) => number,
      headX: number,
      yOf: (m: number) => number,
      H: number,
    ) {
      const yAt = (s: Stroke, x: number) => {
        const m = ribbon.at(s, x)
        return m === null ? null : yOf(m)
      }
      // the slope under him (taken over a few pixels, so the vibrato does not count)
      const slopeAt = (s: Stroke, x: number) => {
        const a = yAt(s, x - 6) ?? yAt(s, x)
        const b = yAt(s, x + 6) ?? yAt(s, x)
        return a === null || b === null ? 0 : Math.max(-8, Math.min(8, (b - a) / 12))
      }
      // (fly: he falls, and flies; otherwise, he jumps, and lands where he aimed)
      const fall = (vx: number, vy: number, fly = true) => Object.assign(me, { mode: 'air', vx, vy, fly })

      if (me.mode === 'gone') {
        // he drops from the sky, just behind the head of the ribbon being sung
        const s = ribbon.singing
        if (!s || s.length < 8) return
        Object.assign(me, { x: s[s.length - 1].x - walk * 0.4, y: -20, vx: walk, vy: 0, mode: 'air', fly: true, on: s })
      }

      if (me.mode === 'hang' && me.on) {
        // hanging from the thread (which moves with the voice): he hangs for a moment, then pulls himself up
        const line = yAt(me.on, me.x) ?? yAt(me.on, me.on[0].x)!
        me.hung += dt
        const up = Math.max(0, Math.min(1, (me.hung - DANGLE) / HOIST))
        me.y = line + HANG_DROP * (1 - up * up * (3 - 2 * up))
        pose = up === 0 ? HANG[Math.floor(me.hung * 6) % HANG.length] : up < 0.75 ? CLIMB[Math.floor(up * 6) % 2] : RISE
        if (up >= 1) Object.assign(me, { mode: 'ride', y: line, speed: 0, idle: 0 })
      }

      if (me.mode === 'ride' && me.on) {
        const s = me.on
        const end = s[s.length - 1].x
        const y = yAt(s, me.x)
        const slope = slopeAt(s, Math.min(me.x, end))
        if (y === null || me.x >= end) {
          me.x = Math.min(me.x, end)
          me.y = yAt(s, me.x) ?? me.y
          const next = s === ribbon.singing ? null : ribbon.after(end)
          if (next) {
            // another ribbon starts farther on: he jumps the gap (one time in three, a little short: he will catch
            // himself at the edge)
            const short = Math.random() < 0.35 ? 0.8 + Math.random() * 0.1 : 1
            const tx = me.x + (next[0].x + 6 - me.x) * short
            const ty = yAt(next, next[0].x + 6) ?? yOf(next[0].midi)
            const T = Math.max(0.35, Math.min(1.3, (tx - me.x) / (walk * 1.6)))
            Object.assign(me, { on: next })
            fall((tx - me.x) / T, (ty - me.y) / T - 0.5 * GRAVITY * T, false)
          } else if (s === ribbon.singing) {
            // at the end of the ribbon being sung: he moves forward with it
            me.speed = walk
            pose = slope > 0.45 ? SLIDE : walking(walk * dt)
          } else if (slope > EDGE) {
            // at the edge of a descent too steep: he cannot hold on, he slides into the void
            pose = SLIDE
            fall(walk * 0.5, 60)
          } else {
            // at the edge of a gap, he waits: standing on flat ground, crouching on a slope
            me.speed = 0
            me.idle += dt
            pose = Math.abs(slope) > 0.25 ? BRACE : me.idle > 4 ? SLEEP[Math.floor(me.idle * 1.5) % 2] : STAND
          }
        } else if (slope > SLIP) {
          // too steep going down: he comes off, carried by his momentum
          pose = FALL
          fall(Math.max(me.speed, walk), Math.max(me.speed, walk) * 0.8)
        } else {
          // the slope sets his speed: he slides going down, struggles going up; steep, he climbs: he rises at a fixed
          // speed, so the steeper it is, the less he moves forward
          const climbing = slope < -STEEP
          // (behind: positive; he catches up when the ground is easy, not while struggling up a climb)
          const late = (headX * HOME - screenX(me.x)) / 200
          const hurry = slope > -0.3 ? 1 + Math.max(-0.25, Math.min(0.9, late)) : 1
          const want = climbing
            ? Math.max(walk * 0.04, (walk * CLIMB_RATE) / -slope)
            : Math.max(walk * 0.3, Math.min(walk * 2.6, walk * (1 + slope * 0.9) * hurry))
          me.speed += (want - me.speed) * (1 - Math.exp(-dt * (climbing ? 10 : 4)))
          me.x = Math.min(end, me.x + me.speed * dt)
          const before = me.y
          me.y = yAt(s, me.x) ?? y
          me.idle = 0
          if (climbing) pose = CLIMB[Math.floor((me.step += Math.abs(me.y - before)) / 10) % CLIMB.length]
          else pose = slope > 0.45 ? SLIDE : walking(me.speed * dt)
        }
      }

      if (me.mode === 'air') {
        const beforeX = me.x
        me.x += me.vx * dt
        me.vy += GRAVITY * dt
        if (me.fly) me.vy = Math.min(FLUTTER, me.vy)
        const before = me.y
        me.y += me.vy * dt
        if (pose !== SLIDE || me.vy > 200)
          pose = me.vy < 0 ? RISE : me.fly ? FLY[Math.floor((me.flap += dt) * 16) % FLY.length] : FALL
        // he gets back on a ribbon as soon as he crosses it: falling onto it, or when the thread rises and catches him
        // from below (a steep descent that turns back up); compare where he was relative to the thread on the previous
        // frame, and now. Otherwise, if he has one within reach (the thread between his feet and his ears, and not too
        // steep: he must be able to pull himself up), he grabs it
        const strokes = me.on ? [me.on, ...ribbon.strokes] : ribbon.strokes
        for (const s of strokes) {
          const y = yAt(s, me.x)
          if (y === null) continue
          const was = yAt(s, beforeX)
          const crossed = was === null ? me.vy > 0 && me.y >= y && me.y - y < 8 : before <= was + 2 && me.y >= y
          if (crossed) {
            Object.assign(me, { mode: 'ride', on: s, y, vy: 0 })
            break
          }
          if (me.vy > 0 && me.y > y + 4 && me.y - REACH < y && Math.abs(slopeAt(s, me.x)) < STEEP) {
            Object.assign(me, { mode: 'hang', on: s, hung: 0, vx: 0, vy: 0, speed: 0 })
            break
          }
        }
      }

      // out of the page: on the left (the ribbon carried him off), or at the bottom (fallen)
      if (screenX(me.x) < 10 || me.y > H + 60) {
        me.mode = 'gone'
        me.on = null
      }
    },
    draw(g: CanvasRenderingContext2D, screenX: (x: number) => number) {
      if (me.mode === 'gone') return
      g.font = FONT
      g.textAlign = 'center'
      g.textBaseline = 'bottom'
      g.fillStyle = '#eeeae2'
      // (feet slightly above the thread)
      const x = screenX(me.x)
      for (let i = 0; i < pose.length; i++) g.fillText(pose[i], x, me.y - 3 - (pose.length - 1 - i) * LINE)
    },
  }
}
