import {
  ALARM,
  DESCENT,
  LAGS,
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

// Le dessin du ciel (voir main.ts) : où est chaque oiseau à l'instant t, et combien il y en a dans chaque case.

const clamp = (x: number) => Math.min(1, Math.max(0, x))

// un oiseau seul est un point, à peine visible ; plus il y en a dans une case, plus le signe s'épaissit et plus
// l'encre fonce (chaque signe a sa couche, avec sa couleur : voir murmuration.css)
const SIGNS = ['.', 'v', 'w', 'W', 'M']
// à partir de combien d'oiseaux dans une case on passe à chaque signe
const FROM = [1, 2, 4, 6, 9]
// le signe pour d oiseaux (son rang dans SIGNS), pour d de 0 à 15 (au-delà : M)
const LEVEL = Array.from({ length: 16 }, (_, d) => FROM.filter((f) => d >= f).length - 1)
// le signe des oiseaux posés, selon leur nombre dans la case (ils sont serrés : il en faut plus pour foncer)
const PERCH_LEVEL = Array.from({ length: 61 }, (_, p) => (p === 0 ? -1 : p < 6 ? 1 : p < 16 ? 2 : p < 34 ? 3 : 4))
const layers = SIGNS.map((_, k) => {
  const layer = document.createElement('pre')
  layer.className = `mm-layer mm-l${k}`
  sky.append(layer)
  return layer
})

// la souris (loin de tout quand elle n'est pas sur la page), et la distance à laquelle les oiseaux la fuient
export const mouse = { x: -1e5, y: -1e5 }
const FEAR = 110
// son mouvement, d'une image à l'autre (lissé) : les oiseaux réagissent à un faucon qui fonce, pas à un faucon
// immobile (ils s'y habituent)
let lastX = -1e5
let lastY = -1e5
let moveX = 0
let moveY = 0
// les vagues d'agitation : chaque fois que la souris fend le nuage, une vague part de l'endroit touché (sa place
// dans la nappe : u, v) et traverse tout le nuage en s'affaiblissant
const WAVE_SPEED = 0.8 // (en largeur de nappe par seconde)
const WAVE_LIFE = 3.5
let waves: { u: number; v: number; at: number }[] = []
let lastWave = 0

// ——— Le ciel à l'instant t (temps du vol), à l'instant now du déroulé ; flying : la boucle d'animation tourne.
// Renvoie le nombre d'oiseaux dérangés encore en l'air (tant qu'il y en a, on continue de dessiner) ———
const poses: Pose[] = []
export function draw(t: number, now: number, flying: boolean) {
  const { cellW, cellH, skyTop, villageCol, villageRow, cols, rows, density, perched } = grid
  const W = innerWidth
  const H = innerHeight
  const { landAt, liftAt, fromX, fromY } = cycle(now)
  // près du village : 0 en plein ciel, 1 bas et serré au-dessus des toits (juste après l'envol, et avant de se
  // poser)
  const ease = (x: number) => {
    const c = clamp(x)
    return c * c * (3 - 2 * c)
  }
  const low = Math.max(
    ease((now - (landAt - DESCENT + 2)) / DESCENT),
    liftAt !== null && now < landAt ? 0.6 * (1 - ease((now - liftAt) / RISE)) : 0,
  )
  const R = Math.min(W, H) * 0.5 * (1 - 0.5 * low)
  // (au-dessus du village : au milieu de ses toits, un peu plus haut que le clocher)
  const lowX = (villageCol + VILLAGE_W * 0.55) * cellW
  const lowY = skyTop + villageRow * cellH - R * 0.6
  // la pose pour chaque retard (ceux de derrière voient la nappe telle qu'elle était un peu plus tôt)
  for (let k = 0; k < LAGS; k++) {
    const late = (k / LAGS) * MAX_LAG
    const P = pose(t - late, W, H)
    P.cx += (lowX - P.cx) * low
    P.cy += (lowY - P.cy) * low
    poses[k] = P
  }

  density.fill(0)
  perched.fill(0)
  // la souris : sa vitesse sur cette image, et la direction de côté (perpendiculaire à sa route)
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
  // (plus elle va vite, plus elle fait peur, jusqu'à une limite)
  const fright = Math.min(1, speed / 25)
  waves = waves.filter((w) => seconds - w.at < WAVE_LIFE)
  let touched = -1
  let touchedD2 = FEAR * FEAR
  let startledNow = 0
  for (let i = 0; i < settings.count; i++) {
    // posé ou non : 0 en vol, 1 posé (en train de se poser, ou de redécoller : entre les deux)
    const land =
      now >= landAt
        ? clamp((now - landAt - settle[i]) / landTime[i])
        : liftAt !== null
          ? 1 -
            clamp(
              (now -
                liftAt -
                leave[i] -
                Math.hypot((perchCol[i] + 0.5) * cellW - fromX, skyTop + (perchRow[i] + 0.5) * cellH - fromY) / ALARM) /
                leaveTime[i],
            )
          : 0
    if (land === 1) {
      // posé : la souris passe tout près ? il s'envole en sursaut, fait un tour dans le ciel en s'écartant d'elle,
      // et revient se poser (à sa place, ou ailleurs)
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
      // un arc : il monte vite, plane, redescend vers sa place (peut-être une autre que celle d'où il est parti)
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
      // (il compte double : seul dans sa case, c'est un v bien visible, pas un point pâle)
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
    // les ondulations qui parcourent la nappe
    let Z =
      R *
      (0.3 * Math.sin(2.6 * a + tt * 2.2) +
        0.22 * Math.sin(2.1 * b - tt * 1.7 + 1) +
        0.12 * Math.sin(4 * (a + b) + tt * 3.1))
    // les vagues d'agitation lancées par la souris : un anneau qui s'élargit dans la nappe ; là où il passe, les
    // oiseaux plongent un instant (la nappe se plie : une bande plus sombre traverse le nuage)
    for (const w of waves) {
      const age = seconds - w.at
      const ring = Math.hypot(a - w.u, b - w.v) - age * WAVE_SPEED
      if (ring > -0.3 && ring < 0.3) Z += R * 0.22 * Math.exp(-ring * ring * 60) * (1 - age / WAVE_LIFE)
    }
    // le passage du faucon : les oiseaux s'écartent, la nappe se creuse
    const dw = a - P.wave
    if (dw > -0.5 && dw < 0.5) {
      const k = Math.exp(-dw * dw * 30)
      Z -= R * 0.45 * k
      Y += R * 0.12 * k * Math.sign(b)
    }
    // la nappe plie (plus loin du centre, plus elle se recourbe)
    const th = P.bend * a
    const ct = Math.cos(th),
      st = Math.sin(th)
    ;[X, Z] = [X * ct - Z * st, X * st + Z * ct]
    // chaque oiseau flotte autour de sa place, à son rythme (lentement, et un peu plus vite)
    X += 7 * Math.sin(s + tt * 1.5) + 3 * Math.sin(s * 2.3 + tt * 4)
    Y += 6 * Math.cos(s * 1.7 + tt * 1.3) + 3 * Math.cos(s * 3.1 + tt * 3.6)
    Z += 8 * Math.sin(s * 0.7 + tt * 1)
    // la nappe tourne (roulis, tangage, lacet)
    const x1 = X * P.cr - Y * P.sr
    const y1 = X * P.sr + Y * P.cr
    const y2 = y1 * P.cp - Z * P.sp
    const z2 = y1 * P.sp + Z * P.cp
    const x3 = x1 * P.cyw + z2 * P.syw
    // vue de loin, de face : on garde x et y
    let px = P.cx + x3
    let py = P.cy + y2
    // la souris, comme un faucon qui fend le nuage : les oiseaux proches s'écartent de chaque côté de sa route
    // (comme l'eau devant une étrave), d'autant plus qu'elle va vite ; puis ils reviennent doucement à leur
    // place, et le nuage se referme derrière elle
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
        // de quel côté de sa route est l'oiseau : il file de ce côté-là (et un peu devant lui, s'il est devant)
        const side = dx * sideX + dy * sideY >= 0 ? 1 : -1
        const f = near * fright * 2.2
        ovx[i] += sideX * side * f + (dx / d) * near * 0.25 * fright
        ovy[i] += sideY * side * f + (dy / d) * near * 0.25 * fright
      }
      // (l'élan retombe, et le ressort ramène l'oiseau vers sa place, chacun à son rythme : le nuage ne se
      // referme pas d'un bloc)
      const pull = 0.002 + 0.003 * ((seed[i] * 7.3) % 1)
      ovx[i] = (ovx[i] - ox[i] * pull) * 0.93
      ovy[i] = (ovy[i] - oy[i] * pull) * 0.93
      ox[i] += ovx[i]
      oy[i] += ovy[i]
    }
    px += ox[i]
    py += oy[i]
    // en descendant se poser : il plonge de sa place dans le nuage vers son toit, comme une coulée (il file d'abord
    // de côté, puis tombe de plus en plus vite)
    if (land > 0) {
      px += ((perchCol[i] + 0.5) * cellW - px) * (1 - (1 - land) ** 2)
      py += (skyTop + (perchRow[i] + 0.5) * cellH - py) * land * land
    }
    const c = Math.floor(px / cellW)
    const r = Math.floor((py - skyTop) / cellH)
    if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c]++
  }

  // la souris a fendu le nuage (assez vite) : une vague d'agitation part de l'oiseau le plus proche
  if (touched >= 0 && fright > 0.3 && seconds - lastWave > 0.6) {
    waves.push({ u: u[touched], v: v[touched], at: seconds })
    lastWave = seconds
  }

  // chaque couche ne garde que ses signes (des espaces ailleurs)
  const texts = SIGNS.map(() => '')
  for (let r = 0; r < rows; r++) {
    const lines = SIGNS.map(() => '')
    for (let c = 0; c < cols; c++) {
      // les oiseaux posés comptent aussi (serrés sur les toits : un signe plus lourd pour autant d'oiseaux)
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
