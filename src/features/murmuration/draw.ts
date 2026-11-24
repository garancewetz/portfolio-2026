import {
  ALARM,
  DESCENT,
  LAGS,
  LAND_SPREAD,
  LAND_TIME,
  MAX_LAG,
  RISE,
  cycle,
  lag,
  landTime,
  leave,
  leaveTime,
  ox,
  oy,
  ovx,
  ovy,
  seed,
  settings,
  settle,
  u,
  v,
} from './flock'
import { sheet } from '@/features/carnet/sheet'
import { VILLAGE_W, grid, sky } from './grid'
import { perchCol, perchRow } from './perches'
import { pose, type Pose } from './pose'
import {
  STARTLE_NEAR,
  startle,
  startled,
  startledDrift,
  startledFromX,
  startledFromY,
  startledLift,
  startledSpan,
} from './startle'

// Drawing the sky (see main.ts): where each bird is at time t, and how many there are in each cell.

const clamp = (x: number) => Math.min(1, Math.max(0, x))

// a lone bird is a dot, barely visible; the more there are in a cell, the heavier the sign and the darker the ink
// (each sign has its layer, with its colour: see murmuration.css)
const SIGNS = ['.', 'v', 'w', 'W', 'M']
// from how many birds in a cell each sign kicks in
const FROM = [1, 2, 4, 6, 9]
// the sign for d birds (its rank in SIGNS), for d from 0 to 15 (beyond: M)
const LEVEL = Array.from({ length: 16 }, (_, d) => FROM.filter((f) => d >= f).length - 1)
// the sign of the perched birds, by their number in the cell (they are packed tight: it takes more to darken)
const PERCH_LEVEL = Array.from({ length: 61 }, (_, p) => (p === 0 ? -1 : p < 6 ? 1 : p < 16 ? 2 : p < 34 ? 3 : 4))
const layers = SIGNS.map((_, k) => {
  const layer = document.createElement('pre')
  layer.className = `mm-layer mm-l${k}`
  sky.append(layer)
  return layer
})

// the mouse (far from everything when it is not on the page), and the distance at which the birds flee it
export const mouse = { x: -1e5, y: -1e5 }
const FEAR = 110
// its movement, from one frame to the next (smoothed): the birds react to a diving falcon, not to a still
// falcon (they get used to it)
let lastX = -1e5
let lastY = -1e5
let moveX = 0
let moveY = 0
// the waves of agitation: each time the mouse cuts through the cloud, a wave starts from the spot hit (its place
// in the sheet: u, v) and crosses the whole cloud, weakening
const WAVE_SPEED = 0.8 // (in sheet widths per second)
const WAVE_LIFE = 3.5
let waves: { u: number; v: number; at: number }[] = []
let lastWave = 0

// ——— The sky at time t (flight time), at time now of the sequence; flying: the animation loop is running.
// Returns the number of disturbed birds still in the air (as long as there are some, keep drawing) ———
const poses: Pose[] = []
export function draw(t: number, now: number, flying: boolean) {
  const { cellW, cellH, skyTop, villageCol, villageRow, cols, rows, density, perched } = grid
  const { w: W, h: H } = sheet()
  const { landAt, liftAt, fromX, fromY, before } = cycle(now)
  // near the village: 0 in open sky, 1 low and tight above the roofs (just after taking off, and before
  // landing)
  const ease = (x: number) => {
    const c = clamp(x)
    return c * c * (3 - 2 * c)
  }
  // (a take-off that interrupts a landing starts again from as low as the cloud had come down)
  const interrupted = liftAt !== null && liftAt < before + LAND_SPREAD + LAND_TIME
  const lowAtLift = interrupted ? Math.max(0.6, ease((liftAt - (before - DESCENT + 2)) / DESCENT)) : 0.6
  const low = Math.max(
    ease((now - (landAt - DESCENT + 2)) / DESCENT),
    liftAt !== null && now < landAt ? lowAtLift * (1 - ease((now - liftAt) / RISE)) : 0,
  )
  const R = Math.min(W, H) * 0.5 * (1 - 0.5 * low)
  // (above the village: in the middle of its roofs, a little higher than the bell tower)
  const lowX = (villageCol + VILLAGE_W * 0.55) * cellW
  const lowY = skyTop + villageRow * cellH - R * 0.6
  // the pose for each delay (those at the back see the sheet as it was a little earlier)
  for (let k = 0; k < LAGS; k++) {
    const late = (k / LAGS) * MAX_LAG
    const P = pose(t - late, W, H)
    P.cx += (lowX - P.cx) * low
    P.cy += (lowY - P.cy) * low
    poses[k] = P
  }

  density.fill(0)
  perched.fill(0)
  // the mouse: its speed on this frame, and the sideways direction (perpendicular to its path)
  const seconds = performance.now() / 1000
  if (flying) {
    const jump = Math.abs(mouse.x - lastX) > 300 || Math.abs(mouse.y - lastY) > 300
    moveX = jump ? 0 : moveX * 0.6 + (mouse.x - lastX) * 0.4
    moveY = jump ? 0 : moveY * 0.6 + (mouse.y - lastY) * 0.4
    lastX = mouse.x
    lastY = mouse.y
  }
  const speed = Math.hypot(moveX, moveY)
  const sideX = speed ? -moveY / speed : 0
  const sideY = speed ? moveX / speed : 0
  // (the faster it goes, the scarier it is, up to a limit)
  const fright = Math.min(1, speed / 25)
  waves = waves.filter((w) => seconds - w.at < WAVE_LIFE)
  let touched = -1
  let touchedD2 = FEAR * FEAR
  let startledNow = 0
  for (let i = 0; i < settings.count; i++) {
    // perched or not: 0 flying, 1 perched (landing, or taking off again: in between)
    const land =
      now >= landAt
        ? clamp((now - landAt - settle[i]) / landTime[i])
        : liftAt !== null
          ? Math.min(
              // (if it had not landed yet when the take-off interrupted the landing: it starts again from where it was)
              clamp((liftAt - before - settle[i]) / landTime[i]),
              1 -
                clamp(
                  (now -
                    liftAt -
                    leave[i] -
                    Math.hypot((perchCol[i] + 0.5) * cellW - fromX, skyTop + (perchRow[i] + 0.5) * cellH - fromY) /
                      ALARM) /
                    leaveTime[i],
                ),
            )
          : 0
    if (land === 1) {
      // perched: the mouse passes very close? it takes off with a start, makes a loop in the sky moving away from it,
      // and comes back to land (in its place, or elsewhere)
      const homeX = (perchCol[i] + 0.5) * cellW
      const homeY = skyTop + (perchRow[i] + 0.5) * cellH
      let age = seconds - startled[i]
      if (age > startledSpan[i] + 0.5 && (homeX - mouse.x) ** 2 + (homeY - mouse.y) ** 2 < STARTLE_NEAR ** 2) {
        startle(i, homeX, homeY, seconds - Math.random() * 0.15, homeX >= mouse.x ? 1 : -1)
        age = seconds - startled[i]
      }
      const span = startledSpan[i]
      if (age >= span) {
        perched[perchRow[i] * cols + perchCol[i]]++
        continue
      }
      startledNow++
      // an arc: it rises fast, glides, comes back down towards its place (maybe another one than where it left from)
      const f = Math.max(0, age) / span
      const e = f * f * (3 - 2 * f)
      const toX = (perchCol[i] + 0.5) * cellW
      const toY = skyTop + (perchRow[i] + 0.5) * cellH
      const px =
        startledFromX[i] +
        (toX - startledFromX[i]) * e +
        startledDrift[i] * Math.sin(Math.PI * f) +
        6 * Math.sin(seed[i] + age * 7)
      const py =
        startledFromY[i] + (toY - startledFromY[i]) * e - startledLift[i] * Math.sin(Math.PI * Math.pow(f, 0.7))
      const c = Math.floor(px / cellW)
      const r = Math.floor((py - skyTop) / cellH)
      // (it counts double: alone in its cell, it is a clearly visible v, not a pale dot)
      if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c] += 2
      continue
    }
    const P = poses[lag[i]]
    const tt = P.t
    const a = u[i]
    const b = v[i]
    const s = seed[i]
    let X = a * R * P.stretchX
    let Y = b * R * P.stretchY
    // the ripples running through the sheet
    let Z =
      R *
      (0.3 * Math.sin(2.6 * a + tt * 2.2) +
        0.22 * Math.sin(2.1 * b - tt * 1.7 + 1) +
        0.12 * Math.sin(4 * (a + b) + tt * 3.1))
    // the waves of agitation set off by the mouse: a ring widening in the sheet; where it passes, the birds dive
    // for a moment (the sheet folds: a darker band crosses the cloud)
    for (const w of waves) {
      const age = seconds - w.at
      const ring = Math.hypot(a - w.u, b - w.v) - age * WAVE_SPEED
      if (ring > -0.3 && ring < 0.3) Z += R * 0.22 * Math.exp(-ring * ring * 60) * (1 - age / WAVE_LIFE)
    }
    // the falcon passing: the birds move aside, the sheet hollows out
    const dw = a - P.wave
    if (dw > -0.5 && dw < 0.5) {
      const k = Math.exp(-dw * dw * 30)
      Z -= R * 0.45 * k
      Y += R * 0.12 * k * Math.sign(b)
    }
    // the sheet folds (the farther from the centre, the more it curls)
    const th = P.bend * a
    const ct = Math.cos(th),
      st = Math.sin(th)
    ;[X, Z] = [X * ct - Z * st, X * st + Z * ct]
    // each bird floats around its place, at its own rhythm (slowly, and a little faster)
    X += 7 * Math.sin(s + tt * 1.5) + 3 * Math.sin(s * 2.3 + tt * 4)
    Y += 6 * Math.cos(s * 1.7 + tt * 1.3) + 3 * Math.cos(s * 3.1 + tt * 3.6)
    Z += 8 * Math.sin(s * 0.7 + tt * 1)
    // the sheet turns (roll, pitch, yaw)
    const x1 = X * P.cr - Y * P.sr
    const y1 = X * P.sr + Y * P.cr
    const y2 = y1 * P.cp - Z * P.sp
    const z2 = y1 * P.sp + Z * P.cp
    const x3 = x1 * P.cyw + z2 * P.syw
    // seen from afar, from the front: keep x and y
    let px = P.cx + x3
    let py = P.cy + y2
    // the mouse, like a falcon cutting through the cloud: the nearby birds move aside on each side of its path
    // (like water before a bow), the more so the faster it goes; then they slowly come back to their place, and
    // the cloud closes up behind it
    if (flying && land === 0) {
      const dx = px + ox[i] - mouse.x
      const dy = py + oy[i] - mouse.y
      const d2 = dx * dx + dy * dy
      if (d2 < FEAR * FEAR) {
        if (d2 < touchedD2) {
          touchedD2 = d2
          touched = i
        }
        const d = Math.sqrt(d2) || 1
        const near = (1 - d / FEAR) ** 2
        // which side of its path the bird is on: it darts that way (and a little ahead, if it is in front)
        const side = dx * sideX + dy * sideY >= 0 ? 1 : -1
        const f = near * fright * 2.2
        ovx[i] += sideX * side * f + (dx / d) * near * 0.25 * fright
        ovy[i] += sideY * side * f + (dy / d) * near * 0.25 * fright
      }
      // (the momentum dies down, and the spring brings the bird back to its place, each at its own rhythm: the cloud
      // does not close up in one block)
      const pull = 0.002 + 0.003 * ((seed[i] * 7.3) % 1)
      ovx[i] = (ovx[i] - ox[i] * pull) * 0.93
      ovy[i] = (ovy[i] - oy[i] * pull) * 0.93
      ox[i] += ovx[i]
      oy[i] += ovy[i]
    }
    px += ox[i]
    py += oy[i]
    // coming down to land: it dives from its place in the cloud towards its roof, like a stream (it darts sideways
    // first, then falls faster and faster)
    if (land > 0) {
      px += ((perchCol[i] + 0.5) * cellW - px) * (1 - (1 - land) ** 2)
      py += (skyTop + (perchRow[i] + 0.5) * cellH - py) * land * land
    }
    const c = Math.floor(px / cellW)
    const r = Math.floor((py - skyTop) / cellH)
    if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c]++
  }

  // the mouse has cut through the cloud (fast enough): a wave of agitation starts from the closest bird
  if (touched >= 0 && fright > 0.3 && seconds - lastWave > 0.6) {
    waves.push({ u: u[touched], v: v[touched], at: seconds })
    lastWave = seconds
  }

  // each layer only keeps its own signs (spaces elsewhere)
  const texts = SIGNS.map(() => '')
  for (let r = 0; r < rows; r++) {
    const lines = SIGNS.map(() => '')
    for (let c = 0; c < cols; c++) {
      // perched birds count too (packed on the roofs: a heavier sign for the same number of birds)
      const d = density[r * cols + c]
      const p = perched[r * cols + c]
      const level = Math.max(LEVEL[Math.min(15, d)], p ? PERCH_LEVEL[Math.min(PERCH_LEVEL.length - 1, p)] : -1)
      for (let k = 0; k < SIGNS.length; k++) lines[k] += k === level ? SIGNS[k] : ' '
    }
    for (let k = 0; k < SIGNS.length; k++) texts[k] += lines[k] + '\n'
  }
  layers.forEach((layer, k) => (layer.textContent = texts[k]))
  return startledNow
}
