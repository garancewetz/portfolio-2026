import './murmuration.css'
import { VILLAGE } from './village'

// Murmuration : un vol d'étourneaux, dessiné en caractères sur toute la page, au-dessus d'un village perché.
// Au départ, le vol attend hors de la page, à gauche ; un clic n'importe où le fait arriver et voler (un autre
// clic le fige, un autre encore le relance).
//
// Vu de loin, un vol d'étourneaux est une grande nappe d'oiseaux en trois dimensions : là où elle se plie, ou
// quand on la voit par la tranche, les oiseaux se superposent et le nuage s'assombrit ; quand elle s'ouvre, il
// s'éclaircit. Ici, chaque oiseau a sa place dans une nappe qui ondule, se tord et tourne lentement en dérivant
// dans le ciel. Le mouvement part de l'avant et se propage : chaque oiseau suit avec un peu de retard, et flotte
// à son rythme autour de sa place. De temps en temps, un faucon passe et une vague traverse le nuage.
// Le ciel est une grille de caractères : plus il y a d'oiseaux dans une case, plus le signe est dense.

const sky = document.querySelector<HTMLDivElement>('.mm-sky')!
document.querySelector<HTMLPreElement>('.mm-village')!.textContent = VILLAGE

// (le vol avance plus lentement que l'horloge : une murmuration flotte, elle ne file pas)
const SLOW = 0.5

// un oiseau seul est un point, à peine visible ; plus il y en a dans une case, plus le signe s'épaissit et plus
// l'encre fonce (chaque signe a sa couche, avec sa couleur : voir murmuration.css)
const SIGNS = ['.', 'v', 'w', 'W', 'M']
// à partir de combien d'oiseaux dans une case on passe à chaque signe
const FROM = [1, 2, 4, 6, 9]
// le signe pour d oiseaux (son rang dans SIGNS), pour d de 0 à 15 (au-delà : M)
const LEVEL = Array.from({ length: 16 }, (_, d) => FROM.filter((f) => d >= f).length - 1)
const layers = SIGNS.map((_, k) => {
  const layer = document.createElement('pre')
  layer.className = `mm-layer mm-l${k}`
  sky.append(layer)
  return layer
})

const COUNT = 4500
// le plus grand retard d'un oiseau sur ceux de devant (en temps du vol)
const MAX_LAG = 1.6
// (les retards sont rangés en quelques paliers : la pose de la nappe n'est calculée qu'une fois par palier)
const LAGS = 48
// chaque oiseau : sa place dans la nappe (u, v, dans un disque), son retard, et un peu de flottement à lui
const u = new Float32Array(COUNT)
const v = new Float32Array(COUNT)
const seed = new Float32Array(COUNT)
const lag = new Uint8Array(COUNT)
for (let i = 0; i < COUNT; i++) {
  const a = Math.random() * Math.PI * 2
  // (un disque aux bords effilochés : quelques oiseaux isolés autour du nuage)
  const r = i % 16 === 0 ? 1 + 0.5 * Math.random() : Math.sqrt(Math.random())
  u[i] = r * Math.cos(a) * (1 + 0.15 * Math.random())
  v[i] = r * Math.sin(a) * (1 + 0.15 * Math.random())
  seed[i] = Math.random() * 1000
  // ceux de derrière (u petit) et des bords suivent avec plus de retard, et chacun a un peu le sien : un virage
  // part de l'avant et se propage dans le nuage, qui s'étire en traînées
  const late = 0.5 * (1 - (u[i] + 1) / 2) + 0.2 * Math.abs(v[i]) + 0.3 * Math.random()
  lag[i] = Math.min(LAGS - 1, Math.floor(Math.max(0, late) * LAGS))
}

let cellW = 7
let cellH = 12
let cols = 0
let rows = 0
let density = new Float32Array(0)

// la taille d'une case : la largeur d'un caractère et la hauteur d'une ligne du ciel
function resize() {
  const probe = document.createElement('span')
  probe.textContent = 'M'.repeat(100)
  sky.append(probe)
  cellW = probe.getBoundingClientRect().width / 100
  probe.remove()
  cellH = parseFloat(getComputedStyle(sky).lineHeight)
  cols = Math.floor(innerWidth / cellW)
  rows = Math.floor(innerHeight / cellH)
  density = new Float32Array(cols * rows)
}

// ——— La pose de la nappe à l'instant t : où elle est, comment elle tourne, s'étire et se plie ———
// (des sommes de lentes oscillations qui ne retombent jamais en phase : le mouvement ne se répète pas)
interface Pose {
  cx: number
  cy: number
  cyw: number
  syw: number
  cp: number
  sp: number
  cr: number
  sr: number
  stretchX: number
  stretchY: number
  bend: number
  wave: number
  t: number
}
function pose(t: number, arrival: number, W: number, H: number, R: number): Pose {
  // le centre du vol dérive dans le haut du ciel, au-dessus du village
  let cx = W * (0.46 + 0.18 * Math.sin(t * 0.05) + 0.07 * Math.sin(t * 0.137 + 1) + 0.03 * Math.sin(t * 0.31))
  // l'arrivée : au départ, le vol attend hors de la page, à gauche (seuls quelques oiseaux isolés dépassent) ; au
  // premier clic, il entre et rejoint sa route en ralentissant (douze secondes)
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, arrival) / 12), 3)
  cx = -R * 1.35 + (cx + R * 1.35) * e
  const cy = H * (0.36 + 0.08 * Math.sin(t * 0.07 + 1) + 0.04 * Math.sin(t * 0.193) + 0.02 * Math.sin(t * 0.41 + 2))
  // la nappe tourne lentement sur elle-même (lacet, tangage, roulis)
  const yaw = t * 0.07 + 1.4 * Math.sin(t * 0.05) + 0.5 * Math.sin(t * 0.171 + 2)
  const pitch = 0.9 * Math.sin(t * 0.11 + 0.4) + 0.35 * Math.sin(t * 0.263)
  const roll = 0.6 * Math.sin(t * 0.08 + 2) + 0.25 * Math.sin(t * 0.229 + 1)
  // le faucon : toutes les vingt secondes environ, une vague traverse la nappe en trois secondes
  const hunt = (t % 21) / 3
  return {
    cx,
    cy,
    cyw: Math.cos(yaw),
    syw: Math.sin(yaw),
    cp: Math.cos(pitch),
    sp: Math.sin(pitch),
    cr: Math.cos(roll),
    sr: Math.sin(roll),
    // elle s'étire et se resserre, et se plie plus ou moins
    stretchX: 1 + 0.25 * Math.sin(t * 0.17) + 0.1 * Math.sin(t * 0.43 + 1),
    stretchY: 0.55 + 0.18 * Math.sin(t * 0.13 + 2) + 0.07 * Math.sin(t * 0.37),
    bend: 1.0 * Math.sin(t * 0.12 + 1) + 0.4 * Math.sin(t * 0.29 + 3),
    wave: hunt < 1 ? -1.6 + hunt * 3.2 : 99,
    t,
  }
}

// ——— Le ciel à l'instant t (temps du vol) ———
const poses: Pose[] = []
function draw(t: number, arrival: number) {
  const W = innerWidth
  const H = innerHeight
  const R = Math.min(W, H) * 0.36
  // la pose pour chaque retard (ceux de derrière voient la nappe telle qu'elle était un peu plus tôt)
  for (let k = 0; k < LAGS; k++) {
    const late = (k / LAGS) * MAX_LAG
    poses[k] = pose(t - late, arrival - late / SLOW, W, H, R)
  }

  density.fill(0)
  for (let i = 0; i < COUNT; i++) {
    const P = poses[lag[i]]
    const tt = P.t
    const a = u[i]
    const b = v[i]
    const s = seed[i]
    let X = a * R * P.stretchX
    let Y = b * R * P.stretchY
    // les ondulations qui parcourent la nappe
    let Z =
      R * (0.3 * Math.sin(2.6 * a + tt * 0.9) + 0.22 * Math.sin(2.1 * b - tt * 0.7 + 1) + 0.12 * Math.sin(4 * (a + b) + tt * 1.3))
    // le passage du faucon : les oiseaux s'écartent, la nappe se creuse
    const dw = a - P.wave
    if (dw > -0.5 && dw < 0.5) {
      const k = Math.exp(-dw * dw * 30)
      Z -= R * 0.45 * k
      Y += R * 0.12 * k * Math.sign(b)
    }
    // la nappe plie (plus loin du centre, plus elle se recourbe)
    const th = P.bend * a
    const ct = Math.cos(th), st = Math.sin(th)
    ;[X, Z] = [X * ct - Z * st, X * st + Z * ct]
    // chaque oiseau flotte autour de sa place, à son rythme (lentement, et un peu plus vite)
    X += 7 * Math.sin(s + tt * 0.6) + 3 * Math.sin(s * 2.3 + tt * 2.1)
    Y += 6 * Math.cos(s * 1.7 + tt * 0.5) + 3 * Math.cos(s * 3.1 + tt * 1.8)
    Z += 8 * Math.sin(s * 0.7 + tt * 0.4)
    // la nappe tourne (roulis, tangage, lacet)
    const x1 = X * P.cr - Y * P.sr
    const y1 = X * P.sr + Y * P.cr
    const y2 = y1 * P.cp - Z * P.sp
    const z2 = y1 * P.sp + Z * P.cp
    const x3 = x1 * P.cyw + z2 * P.syw
    // vue de loin, de face : on garde x et y
    const c = Math.floor((P.cx + x3) / cellW)
    const r = Math.floor((P.cy + y2) / cellH)
    if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c]++
  }

  // chaque couche ne garde que ses signes (des espaces ailleurs)
  const texts = SIGNS.map(() => '')
  for (let r = 0; r < rows; r++) {
    const lines = SIGNS.map(() => '')
    for (let c = 0; c < cols; c++) {
      const level = LEVEL[Math.min(15, density[r * cols + c])]
      for (let k = 0; k < SIGNS.length; k++) lines[k] += k === level ? SIGNS[k] : ' '
    }
    for (let k = 0; k < SIGNS.length; k++) texts[k] += lines[k] + '\n'
  }
  layers.forEach((layer, k) => (layer.textContent = texts[k]))
}

// ——— Voler, ou rester figé ———
// t : le temps du vol (il n'avance que quand les oiseaux volent) ; on part d'un instant où la nappe est belle
let t = 14
// le temps de vol depuis le premier clic (pour l'arrivée par la gauche)
let arrival = 0
let flying = false
let frame = 0
let last = 0
function loop(now: number) {
  // (le temps réel écoulé, mais pas plus d'un dixième de seconde d'un coup : après un onglet en arrière-plan,
  // le vol reprend où il en était)
  if (last) {
    const dt = Math.min(0.1, (now - last) / 1000)
    t += dt * SLOW
    arrival += dt
  }
  last = now
  draw(t, arrival)
  frame = requestAnimationFrame(loop)
}
function toggle() {
  flying = !flying
  document.documentElement.classList.toggle('is-flying', flying)
  if (flying) {
    last = 0
    frame = requestAnimationFrame(loop)
  } else cancelAnimationFrame(frame)
}
addEventListener('click', toggle)
// (au clavier aussi : Espace ou Entrée)
addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
})
addEventListener('resize', () => {
  resize()
  draw(t, arrival)
})

document.fonts.ready.then(() => {
  resize()
  draw(t, arrival)
})
