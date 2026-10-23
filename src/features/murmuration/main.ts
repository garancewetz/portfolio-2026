import './murmuration.css'
import { VILLAGE } from './village'

// Murmuration : un vol d'étourneaux, dessiné en caractères sur toute la page, au-dessus d'un village perché.
// Au départ, les oiseaux sont posés sur les toits du village et sur le bas de la page. Un clic n'importe où les
// fait s'envoler : ils font leur murmuration, puis, au bout de quarante secondes, se reposent un par un. Un autre
// clic les fait repartir, et ainsi de suite (en plein vol, un clic fige le vol, un autre le relance).
// On peut aussi le regarder image par image : en faisant défiler (deux doigts sur le trackpad, ou la molette),
// le temps avance ou recule ; avec les flèches ← →, une image à la fois.
//
// Vu de loin, un vol d'étourneaux est une grande nappe d'oiseaux en trois dimensions : là où elle se plie, ou
// quand on la voit par la tranche, les oiseaux se superposent et le nuage s'assombrit ; quand elle s'ouvre, il
// s'éclaircit. Ici, chaque oiseau a sa place dans une nappe qui ondule, se tord et tourne lentement en dérivant
// dans le ciel. Le mouvement part de l'avant et se propage : chaque oiseau suit avec un peu de retard, et flotte
// à son rythme autour de sa place. De temps en temps, un faucon passe et une vague traverse le nuage.
// Le ciel est une grille de caractères : plus il y a d'oiseaux dans une case, plus le signe est dense.

const sky = document.querySelector<HTMLDivElement>('.mm-sky')!
const village = document.querySelector<HTMLPreElement>('.mm-village')!
village.textContent = VILLAGE

// (le vol avance plus lentement que l'horloge : une murmuration flotte, elle ne file pas)
const SLOW = 0.5

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

const COUNT = 6000
// le déroulé, en secondes de vol : au départ, ils sont posés ; un clic les fait s'envoler (étalés sur quelques
// secondes, chacun mettant LIFT_TIME secondes à rejoindre le nuage) ; FLY secondes après, ils se reposent (étalés
// sur LAND_SPREAD secondes, chacun mettant LAND_TIME secondes à descendre jusqu'à sa place) ; et ainsi de suite
const LIFT_TIME = 4
const FLY = 40
const LAND_SPREAD = 10
const LAND_TIME = 5
// les instants (en secondes de vol) où on les a fait s'envoler
let lifts: number[] = []
// où en est le vol à l'instant clock : depuis quand ils sont partis (ou null), et quand ils se poseront
function cycle(clock: number) {
  let landAt = -Infinity
  let liftAt: number | null = null
  for (const at of lifts) {
    if (at <= clock && at >= landAt + LAND_SPREAD + LAND_TIME) {
      liftAt = at
      landAt = at + FLY
    }
  }
  return { landAt, liftAt }
}
// tous posés ?
const landed = (clock: number) => clock >= cycle(clock).landAt + LAND_SPREAD + LAND_TIME
// le plus grand retard d'un oiseau sur ceux de devant (en temps du vol)
const MAX_LAG = 1.6
// (les retards sont rangés en quelques paliers : la pose de la nappe n'est calculée qu'une fois par palier)
const LAGS = 48
// chaque oiseau : sa place dans la nappe (u, v, dans un disque), son retard, et un peu de flottement à lui
const u = new Float32Array(COUNT)
const v = new Float32Array(COUNT)
const seed = new Float32Array(COUNT)
const lag = new Uint8Array(COUNT)
// quand il se pose (secondes après le début de l'atterrissage : ils ne se posent pas tous ensemble)
const settle = new Float32Array(COUNT)
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
  settle[i] = Math.random() * LAND_SPREAD
}

let cellW = 7
let cellH = 12
let skyTop = 0
const VILLAGE_LINES = VILLAGE.split('\n')
const VILLAGE_W = Math.max(...VILLAGE_LINES.map((line) => line.length))
let villageCol = 0
let villageRow = 0
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
  // (la dernière ligne du ciel touche le bas de la page ; la première est un peu coupée en haut)
  rows = Math.ceil(innerHeight / cellH)
  skyTop = innerHeight - rows * cellH
  sky.style.top = `${skyTop}px`
  density = new Float32Array(cols * rows)
  perched = new Uint16Array(cols * rows)
  // le village, sur la même grille que le ciel, en bas à droite (pour que les oiseaux se posent pile sur les toits)
  villageCol = cols - VILLAGE_W - Math.round(Math.min(32, Math.max(16, innerWidth * 0.024)) / cellW)
  villageRow = rows - VILLAGE_LINES.length
  village.style.left = `${villageCol * cellW}px`
  village.style.top = `${skyTop + villageRow * cellH}px`
  perches()
}

// ——— Où se poser : sur les toits du village (les « _ » qui n'ont rien au-dessus d'eux) et la pointe du clocher,
// et, pour ceux qui n'y trouvent pas de place, sur le bas de la page, à gauche du village ———
let perched = new Uint16Array(0)
// la place de chaque oiseau : sa case dans le ciel (colonne, ligne)
const perchCol = new Int16Array(COUNT)
const perchRow = new Int16Array(COUNT)
// le ciel dans le dessin du village : les espaces qu'on atteint depuis le haut en descendant ou en allant de côté
// (pas l'intérieur des maisons, fermé par leurs murs et leur toit)
const OPEN = VILLAGE_LINES.map((line) => Array.from({ length: VILLAGE_W }, (_, x) => (line[x] ?? ' ') === ' '))
const SKY = OPEN.map((row) => row.map(() => false))
OPEN.forEach((row, y) => {
  row.forEach((open, x) => (SKY[y][x] = open && (y === 0 || SKY[y - 1][x])))
  for (let changed = true; changed; ) {
    changed = false
    for (let x = 0; x < VILLAGE_W; x++) {
      if (row[x] && !SKY[y][x] && (SKY[y][x - 1] || SKY[y][x + 1])) changed = SKY[y][x] = true
    }
  }
})
// la dernière ligne de l'église (le bas de sa façade)
const CHURCH_BASE = VILLAGE_LINES.findIndex((line) => line.includes('|________|'))
function perches() {
  const roofs: [number, number][] = []
  VILLAGE_LINES.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      // l'église : seulement sur son toit et la pointe du clocher (pas sur le bas de sa façade) ; les maisons : sur
      // tous leurs toits, même ceux des rangées du bas
      if (y <= CHURCH_BASE ? y > 0 && !SKY[y - 1][x] : VILLAGE_LINES[y - 1]?.[x] === '_') continue
      // sur un toit (« _ ») : dans la même case, le v posé sur le trait ; sur la pointe du clocher : juste au-dessus
      if (line[x] === '_') roofs.push([villageCol + x, villageRow + y])
      else if (line[x] === '/' || line[x] === '\\') roofs.push([villageCol + x, villageRow + y - 1])
    }
  })
  // le sol : le bas de la page, de la gauche jusqu'au village
  const ground: [number, number][] = []
  const end = villageCol - 2
  for (let col = 1; col < end; col++) ground.push([col, rows - 1])
  // les oiseaux se répartissent sur toutes les places, autant sur chacune ; chacun va vers une place du même côté
  // que lui dans le nuage (de gauche à droite)
  const order = Array.from({ length: COUNT }, (_, i) => i).sort((a, b) => u[a] - u[b])
  const places = [...ground, ...roofs].sort((a, b) => a[0] - b[0])
  order.forEach((bird, k) => {
    const place = places[Math.floor((k / COUNT) * places.length)]
    perchCol[bird] = place[0]
    perchRow[bird] = place[1]
  })
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
function pose(t: number, W: number, H: number): Pose {
  // le centre du vol dérive dans le haut du ciel, au-dessus du village
  const cx = W * (0.46 + 0.18 * Math.sin(t * 0.05) + 0.07 * Math.sin(t * 0.137 + 1) + 0.03 * Math.sin(t * 0.31))
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
function draw(t: number, now: number) {
  const W = innerWidth
  const H = innerHeight
  const R = Math.min(W, H) * 0.5
  // la pose pour chaque retard (ceux de derrière voient la nappe telle qu'elle était un peu plus tôt)
  for (let k = 0; k < LAGS; k++) {
    const late = (k / LAGS) * MAX_LAG
    poses[k] = pose(t - late, W, H)
  }

  density.fill(0)
  perched.fill(0)
  const { landAt, liftAt } = cycle(now)
  const clamp = (x: number) => Math.min(1, Math.max(0, x))
  for (let i = 0; i < COUNT; i++) {
    // posé ou non : 0 en vol, 1 posé (en train de se poser, ou de redécoller : entre les deux)
    const land =
      now >= landAt
        ? clamp((now - landAt - settle[i]) / LAND_TIME)
        : liftAt !== null
          ? 1 - clamp((now - liftAt - settle[i] * 0.3) / LIFT_TIME)
          : 0
    if (land === 1) {
      perched[perchRow[i] * cols + perchCol[i]]++
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
    let px = P.cx + x3
    let py = P.cy + y2
    // en descendant se poser : de sa place dans le nuage à sa place sur le toit, en douceur, avec un dernier
    // petit envol au-dessus avant de se poser
    if (land > 0) {
      const e = land * land * (3 - 2 * land)
      px += ((perchCol[i] + 0.5) * cellW - px) * e
      py += (skyTop + (perchRow[i] + 0.5) * cellH - py) * e - Math.sin(Math.PI * land) * 30
    }
    const c = Math.floor(px / cellW)
    const r = Math.floor((py - skyTop) / cellH)
    if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c]++
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
}

// ——— Voler, ou rester figé, ou avancer image par image ———
// clock : le temps de vol, en secondes (il n'avance que quand les oiseaux volent, ou quand
// on fait défiler) ; la nappe, elle, vit plus lentement (SLOW), à partir d'un instant où elle est belle
let clock = 0
const show = () => draw(14 + clock * SLOW, clock)
let flying = false
let frame = 0
let last = 0
function loop(now: number) {
  // (le temps réel écoulé, mais pas plus d'un dixième de seconde d'un coup : après un onglet en arrière-plan,
  // le vol reprend où il en était)
  if (last) clock += Math.min(0.1, (now - last) / 1000)
  last = now
  show()
  // (tous reposés : plus rien ne bouge, on s'arrête jusqu'au prochain clic)
  if (landed(clock)) return toggle()
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
// avancer ou reculer le temps à la main (le vol se fige d'abord, s'il volait)
function scrub(seconds: number) {
  if (flying) toggle()
  clock = Math.max(0, clock + seconds)
  show()
}
// un clic : voler ou se figer ; quand tous sont posés, les faire redécoller
function press() {
  if (landed(clock)) {
    lifts = [...lifts.filter((at) => at < clock), clock]
    if (!flying) toggle()
  } else toggle()
}
addEventListener('click', press)
addEventListener('keydown', (e) => {
  // Espace ou Entrée : voler ou se figer
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    press()
  }
  // ← → : une image en arrière ou en avant (avec Maj : une demi-seconde)
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    scrub((e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 0.5 : 1 / 60))
  }
})
// faire défiler (deux doigts sur le trackpad, ou la molette) : le temps suit les doigts, vers le bas ou la droite
// il avance, vers le haut ou la gauche il recule (quatre pixels de défilement : une image)
addEventListener(
  'wheel',
  (e) => {
    // (pas le pincement pour zoomer : le navigateur le garde)
    if (e.ctrlKey) return
    e.preventDefault()
    const px = e.deltaMode === 1 ? (e.deltaX + e.deltaY) * 16 : e.deltaX + e.deltaY
    scrub(px / 4 / 60)
  },
  { passive: false },
)
addEventListener('resize', () => {
  resize()
  show()
})

document.fonts.ready.then(() => {
  resize()
  show()
})
