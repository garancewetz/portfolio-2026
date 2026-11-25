// The fireworks bursts (see show.ts): what an explosion throws out as sparks, depending on its kind.

export const GOLD = 5 // (index of gold in COLORS, see show.ts)

export type Shell = 'peony' | 'chrysanthemum' | 'willow' | 'palm' | 'ring'
export const SHELLS: Shell[] = ['peony', 'chrysanthemum', 'willow', 'palm', 'ring', 'peony', 'chrysanthemum']

export interface Spark {
  x: number
  y: number
  px: number // position on the previous frame (the stroke goes from there to here)
  py: number
  vx: number
  vy: number
  drag: number // air drag (per second)
  fall: number // share of gravity
  life: number // seconds left
  max: number // total lifetime
  color: number
  width: number
  crackle: boolean // crackles at the end of its life
  rocket?: { shell: Shell; size: number; colors: [number, number]; trail: number } // a rocket: bursts at the end of its life
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)

// one more spark (without its previous position: it starts from where it is)
export type Add = (s: Omit<Spark, 'px' | 'py'>) => void

// the sparks of a burst of kind shell at (x, y), thrown at speed speed, in colours a and b; gold: the colour of
// the golden touches (the willow, the palm's flashes; another one if the palette has no gold)
export function shellOf(
  add: Add,
  x: number,
  y: number,
  speed: number,
  shell: Shell,
  a: number,
  b: number,
  gold = GOLD,
) {
  // the starting flash: a few flashes in the burst's colour, very fast and very short
  for (let i = 0; i < 24; i++) {
    const t = Math.random() * Math.PI * 2
    const v = rand(0.3, 1) * speed * 1.4
    add({
      x,
      y,
      vx: Math.cos(t) * v,
      vy: Math.sin(t) * v,
      drag: 6,
      fall: 0.2,
      life: rand(0.15, 0.3),
      max: 0.3,
      color: a,
      width: 2.5,
      crackle: false,
    })
  }
  if (shell === 'palm') {
    // palm: a few big arms rising then falling back as rain
    const n = 9
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 + rand(-0.1, 0.1)
      for (let k = 0; k < 14; k++) {
        const v = speed * rand(0.75, 1.05)
        const life = rand(1.6, 2.3)
        add({
          x,
          y,
          vx: Math.cos(t) * v + rand(-12, 12),
          vy: Math.sin(t) * v + rand(-12, 12),
          drag: 1.3,
          fall: 1,
          life,
          max: life,
          color: k % 4 ? a : gold,
          width: 3,
          crackle: k % 4 === 0,
        })
      }
    }
    return
  }
  const n = shell === 'willow' ? 150 : shell === 'ring' ? 90 : 170
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + rand(-0.04, 0.04)
    // a sphere seen from the front: the projected speed varies (ring: all at the same speed)
    const v = speed * (shell === 'ring' ? rand(0.95, 1.02) : Math.sqrt(Math.random()) * 0.35 + rand(0.6, 0.68))
    const life = shell === 'willow' ? rand(2.6, 3.6) : rand(1.3, 2.1)
    add({
      x,
      y,
      vx: Math.cos(t) * v,
      vy: Math.sin(t) * v,
      drag: shell === 'willow' ? 2.2 : 1.7,
      fall: shell === 'willow' ? 1.3 : 0.8,
      life,
      max: life,
      color: shell === 'willow' ? gold : i % 2 ? a : b,
      width: shell === 'willow' ? 1.6 : 2.2,
      crackle: shell === 'chrysanthemum' || (shell === 'willow' && i % 3 === 0),
    })
  }
  // the peony and the ring: a core in another colour, smaller
  if (shell === 'peony' || shell === 'ring') {
    for (let i = 0; i < 60; i++) {
      const t = Math.random() * Math.PI * 2
      const v = speed * rand(0.2, 0.42)
      const life = rand(1, 1.6)
      add({
        x,
        y,
        vx: Math.cos(t) * v,
        vy: Math.sin(t) * v,
        drag: 1.7,
        fall: 0.8,
        life,
        max: life,
        color: b,
        width: 2,
        crackle: false,
      })
    }
  }
}
