// The trace of the jumps: each creature has its colour; awake, it leaves behind a thin line in its colour, which
// keeps the shape of its jumps. The line slides left as it ages, like a seismograph's plot, and fades gently;
// when the creature falls asleep again, it finishes fading.

const COLORS = ['#ff48b0', '#ffb511', '#00a95c', '#ff6c2f', '#0078bf', '#765ba7', '#f15060']
const LIFE = 3.2 // how long a point of the trace lasts (s)
const DRIFT = 72 // its speed to the left (px/s)

type Point = { x: number; y: number; t: number }

export function trace(room: HTMLElement, count: number) {
  const cv = Object.assign(document.createElement('canvas'), { className: 'cr-trace' })
  room.prepend(cv)
  const ctx = cv.getContext('2d')!
  const all: Point[][] = Array.from({ length: count }, () => [])
  const size = () => {
    const d = Math.min(2, devicePixelRatio)
    cv.width = room.clientWidth * d
    cv.height = room.clientHeight * d
    ctx.setTransform(d, 0, 0, d, 0, 0)
  }
  size()
  addEventListener('resize', size)

  // a point of the trace: where its feet are, now (only when awake)
  function add(i: number, x: number, y: number, now: number) {
    all[i].push({ x, y, t: now })
  }

  // the drawing; returns whether something is left to fade
  function paint(now: number) {
    ctx.clearRect(0, 0, cv.width, cv.height)
    let left = false
    all.forEach((pts, i) => {
      while (pts.length && now - pts[0].t > LIFE) pts.shift()
      if (pts.length < 2) return
      left = true
      ctx.strokeStyle = COLORS[i % COLORS.length]
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      // (segment by segment: the oldest, paler)
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1]
        const b = pts[k]
        ctx.globalAlpha = 1 - (now - a.t) / LIFE
        ctx.beginPath()
        ctx.moveTo(a.x - (now - a.t) * DRIFT, a.y)
        ctx.lineTo(b.x - (now - b.t) * DRIFT, b.y)
        ctx.stroke()
      }
    })
    ctx.globalAlpha = 1
    return left
  }

  return { add, paint }
}
