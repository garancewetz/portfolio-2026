// The little man and his moves, on the edges of the window: the bottom (he walks), the sides (he climbs), the
// top (he moves along hanging, hand over hand). Off the edges, he falls; he jumps (space bar), and in the air
// he can jump twice more (a triple jump). The window is his box, and what you do to it affects him: an edge
// moving away makes him let go or fall, an edge moving in pushes him, a window too low crushes him; a window
// moved fast jostles him (inertia: he goes the opposite way), makes him slide, take off, lose his grip. The
// lines he has drawn (trail.ts) are not floors: he goes through them; but with ↑, he grabs them, and follows
// them with the arrows, in every direction: steep, he climbs them; flat, he pulls himself up and moves along
// hanging under them.
// This module draws nothing: it says where he is, in which posture, facing which way, and how far he has
// gone (the walking frame depends on it).

export type Where = 'floor' | 'wall' | 'line' | 'ceiling' | 'air' | 'carried' | 'away' | 'sleep' | 'door'
export type Keys = { left: boolean; right: boolean; up: boolean; down: boolean; jump?: boolean }
export type Size = () => { W: number; H: number; w: number; h: number }
// the lines he has drawn: the closest to a point (the point to grab, and the line's direction)
export type Lines = {
  near: (
    x: number,
    y: number,
    reach: number,
    keep?: (p: { x: number; y: number; ux: number; uy: number }) => boolean,
  ) => { x: number; y: number; ux: number; uy: number } | null
}

const WALK = 150 // px/s, walking
const CLIMB = 95 // px/s, climbing
const HANG = 110 // px/s, hanging
const GRAVITY = 1800 // px/s², falling
const JUMP = 620 // px/s, the momentum of a jump (about 100 px high)
const AGAIN = 560 // px/s, the momentum of one more jump, in the air
const AIR_JUMPS = 2 // in the air, he can still jump twice (a triple jump)
const FRICTION = 7 // on the ground, a slide stops quickly
const BOUNCE = 0.35 // against an edge, in the air: he bounces a little
const SLIP = 1400 // px/s²: the window moves harder than that, he slides on the ground
const GRIP = 2600 // px/s²: harder than that, he lets go of the edge he holds
const REACH = 10 // px: following a line, he loses it (its end) if there is no more of it closer than that

export function createBody(size: Size, lines?: Lines) {
  const b = {
    where: 'floor' as Where,
    // the little man's box (top-left corner, px), his side (1: facing right), his speed (slide, fall)
    x: 0,
    y: 0,
    face: 1 as 1 | -1,
    vx: 0,
    vy: 0,
    // the distance covered (for the walking and climbing frames); whether he is moving right now; whether he was
    // just pushed by an edge (s), or is crushed by a window too low
    trip: 0,
    moving: false,
    pushed: 0,
    squashed: false,
    // the jumps already made in the air (they come back on touching a floor, an edge, a line)
    jumps: 0,
    // hanging on a line: where his hands are (on the line), and whether the line is steep (he climbs it) or flat
    // (he hangs from it)
    grip: { x: 0, y: 0 },
    steep: true,
    // (he has just let go of a line: for a moment, he does not grab it again, even with ↑ held)
    cool: 0,
  }
  // on arrival: in the middle, at the bottom
  const start = () => {
    const { W, H, w, h } = size()
    Object.assign(b, { where: 'floor', x: (W - w) / 2, y: H - h, face: 1, vx: 0, vy: 0, trip: 0 })
  }
  start()
  // he lets go (or takes off): in the air, with this momentum
  const fall = (vx = 0, vy = 0) => {
    if (b.where === 'line') b.cool = 0.45
    Object.assign(b, { where: 'air', vx, vy })
  }

  // dragged by the mouse, towards (x, y)
  function drag(x: number, y: number) {
    if (b.where === 'carried') Object.assign(b, { x, y })
  }
  // hanging on a line, his hands on the line: his box (steep: against the line, on the side he faces, his hands
  // at shoulder height; flat: hanging below, hands up)
  const GRIP_AT = 0.3 // (his hands, as a share of his height)
  function hang(w: number, h: number) {
    if (b.steep) Object.assign(b, { x: b.face === 1 ? b.grip.x - w : b.grip.x, y: b.grip.y - h * GRIP_AT })
    else Object.assign(b, { x: b.grip.x - w / 2, y: b.grip.y })
  }

  // dt: elapsed time (s); k: the arrows held; ax, ay: the window's acceleration on screen (px/s²)
  function step(dt: number, k: Keys, ax = 0, ay = 0) {
    if (b.where === 'carried' || b.where === 'away' || b.where === 'sleep' || b.where === 'door') return
    const { W, H, w, h } = size()
    const right = W - w
    const floor = H - h
    const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    const dy = (k.down ? 1 : 0) - (k.up ? 1 : 0)
    const was = { x: b.x, y: b.y }
    // an edge moving in pushes him (he stays in the window)
    if (b.x > right + 0.5 || b.x < -0.5) b.pushed = 0.4
    b.pushed = Math.max(0, b.pushed - dt)
    b.squashed = H < h * 1.7
    // (against which edge: -1 left, 1 right, 0 none)
    const side = b.x <= 0.5 ? -1 : b.x >= right - 0.5 ? 1 : 0
    const shake = Math.hypot(ax, ay)

    if (b.where === 'floor') {
      // the floor has moved away (the window grew downwards): he falls
      if (b.y < floor - 1) fall()
      // the window moves hard: he slides the opposite way; harder downwards than gravity: he takes off
      else if (ay > GRAVITY) fall(-ax * dt, -(ay - GRAVITY) * dt)
      else {
        if (Math.abs(ax) > SLIP) b.vx -= ax * dt
        b.vx *= Math.exp(-FRICTION * dt)
        if (k.jump && !b.squashed) fall(b.vx, -JUMP)
        if (dx) b.face = dx as 1 | -1
        b.x += (b.vx + (b.squashed ? 0.4 : 1) * dx * WALK) * dt
        if (b.where === 'floor') b.y = floor
        // against an edge, the up arrow: he climbs
        if (side && dy < 0 && !b.squashed) b.where = 'wall'
      }
    } else if (b.where === 'line') {
      // hanging on a line: the arrows move him along it, in their direction (steep: he climbs; flat: he moves along
      // hanging); at the end, he goes over the top (going up) or falls; with the space bar, or moving away from a
      // steep line, he lets go
      const here = lines?.near(b.grip.x, b.grip.y, REACH) ?? null
      const len = Math.hypot(dx, dy) || 1
      if (!here || shake > GRIP) fall()
      else if (k.jump) fall(-b.face * 80, -JUMP * 0.8)
      else if (b.steep && dx === -b.face && !dy) fall(-b.face * 40, 0)
      else {
        // (the line's direction that matches the arrows, and his speed: climbing or hanging)
        const along = (here.ux * dx + here.uy * dy) / len
        const speed = b.steep ? CLIMB : HANG
        const gx = here.x + here.ux * along * speed * dt
        const gy = here.y + here.uy * along * speed * dt
        const next = lines?.near(gx, gy, REACH) ?? null
        // (at the end: no more line where he is going, or he pushes without moving, stuck to the last point)
        const stuck =
          !!next && Math.abs(along) > 0.3 && Math.hypot(next.x - here.x, next.y - here.y) < speed * dt * 0.25
        if (!next || stuck) {
          // the end of the line: going up, he pulls himself over it; otherwise he falls
          if (here.uy * along < 0) fall(b.face * 140, -420)
          else fall()
        } else {
          b.grip = { x: next.x, y: next.y }
          b.steep = Math.abs(next.uy) > Math.abs(next.ux)
          if (!b.steep && dx) b.face = dx as 1 | -1
          hang(w, h)
          // (back down to the ground: he finds his feet there)
          if (b.y >= floor && dy > 0) Object.assign(b, { where: 'floor', y: floor })
        }
      }
    } else if (b.where === 'wall') {
      // the edge has moved away (the window grew), or the window shakes him: he lets go
      if (!side || shake > GRIP) fall(-ax * dt * 0.5, -ay * dt * 0.5)
      else {
        b.face = side === -1 ? -1 : 1
        b.x = side === -1 ? 0 : right
        b.y = Math.min(floor, Math.max(0, b.y + dy * CLIMB * dt))
        if (b.y >= floor && dy > 0) b.where = 'floor'
        // at the top, inwards: he goes under the top edge, hanging; lower, inwards: he lets go
        const away = dx === -side && dx !== 0
        if (away && b.y <= 0) b.where = 'ceiling'
        else if (away) fall()
      }
    } else if (b.where === 'ceiling') {
      if (shake > GRIP) fall(-ax * dt * 0.5, -ay * dt * 0.5)
      else {
        if (dx) b.face = dx as 1 | -1
        b.x += dx * HANG * dt
        b.y = 0
        // against an edge, the down arrow: he climbs down along the edge; elsewhere: he lets go, and falls
        if (dy > 0) {
          if (side) b.where = 'wall'
          else fall()
        }
      }
    } else {
      // in the air: one more jump (twice at most, before touching something again)
      if (k.jump && b.jumps < AIR_JUMPS) Object.assign(b, { vy: -AGAIN, jumps: b.jumps + 1 })
      // gravity, inertia when the window moves, and the arrows still carry him a little
      b.vx -= ax * dt
      b.vy += (GRAVITY - ay) * dt
      if (dx) b.face = dx as 1 | -1
      b.x += (b.vx + dx * WALK * 0.7) * dt
      b.y += b.vy * dt
      if (b.x < 0 || b.x > right) {
        b.x = Math.min(right, Math.max(0, b.x))
        b.vx = -b.vx * BOUNCE
      }
      // against an edge, the up arrow: he grabs it (jumping, or falling)
      const touching = b.x <= 0.5 || b.x >= right - 0.5
      if (b.where === 'air' && touching && dy < 0 && b.y < floor) Object.assign(b, { where: 'wall', vx: 0, vy: 0 })
      if (b.where === 'air' && b.y < 0) {
        b.y = 0
        if (dy < 0) Object.assign(b, { where: 'ceiling', vx: 0, vy: 0 })
        else b.vy = Math.abs(b.vy) * BOUNCE
      }
      if (b.where === 'air' && b.y >= floor) Object.assign(b, { y: floor, vy: 0, where: 'floor' })
    }
    // the up arrow, a line within reach of his hands: first a flat line just above his head (he pulls himself up,
    // hanging); otherwise the closest one around his upper body, not under his feet (steep: he gets against it;
    // flat: he hangs from it)
    b.cool = Math.max(0, b.cool - dt)
    if (dy < 0 && !b.cool && (b.where === 'floor' || b.where === 'air')) {
      const cx = b.x + w / 2
      const flat = (p: { ux: number; uy: number }) => Math.abs(p.uy) <= Math.abs(p.ux)
      const g =
        lines?.near(cx, b.y, 30, (p) => flat(p) && p.y <= b.y + 4) ??
        lines?.near(cx, b.y + h * GRIP_AT, w * 0.9) ??
        null
      if (g && g.y < b.y + h * 0.7) {
        b.steep = Math.abs(g.uy) > Math.abs(g.ux)
        if (b.steep) b.face = g.x >= cx ? 1 : -1
        Object.assign(b, { where: 'line', grip: { x: g.x, y: g.y }, vx: 0, vy: 0 })
        hang(w, h)
      }
    }
    // (he touches something: his air jumps come back)
    if (b.where !== 'air') b.jumps = 0
    // (always inside the window, even if it shrank)
    b.x = Math.min(right, Math.max(0, b.x))
    b.y = Math.min(floor, Math.max(0, b.y))
    const moved = Math.hypot(b.x - was.x, b.y - was.y)
    b.moving = moved > 0.01 && b.where !== 'air'
    b.trip += moved
  }

  return { body: b, step, start, fall, drag }
}
