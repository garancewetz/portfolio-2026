import './murmuration.css'
import { VILLAGE } from './village'

// Murmuration : un vol d'étourneaux, dessiné en caractères sur toute la page, au-dessus d'un village perché.
// Au départ, les oiseaux sont posés sur les toits du village et sur le bas de la page. Un clic n'importe où les
// fait s'envoler : ils font leur murmuration, puis, au bout de vingt-cinq secondes, le nuage s'abaisse au-dessus
// du village, se resserre, et les oiseaux plongent se poser par coulées. Un autre clic les fait repartir, et ainsi
// de suite (en plein vol, un clic fige le vol, un autre le relance).
// Posés, ils s'envolent quand la souris passe sur eux, font un petit tour et reviennent à leur place ; et de
// temps en temps, un ou deux s'envolent tout seuls.
// En plein vol, la souris fait comme un faucon : le nuage s'écarte de chaque côté de sa route, une vague
// d'agitation le traverse, puis il se referme.
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

// en vol (la boucle d'animation tourne) ou non (posés, ou vol figé) ; la boucle et son dernier instant
let flying = false
let frame = 0
let last = 0
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

const COUNT = 6000
// le déroulé, en secondes de vol : au départ, ils sont posés ; un clic les fait s'envoler (étalés sur quelques
// secondes, chacun mettant LIFT_TIME secondes à rejoindre le nuage) ; FLY secondes après, ils se reposent (étalés
// sur LAND_SPREAD secondes, chacun mettant LAND_TIME secondes à descendre jusqu'à sa place) ; et ainsi de suite
const LIFT_TIME = 2.5
const FLY = 25
const LAND_SPREAD = 8
const LAND_TIME = 3.5
const STREAMS = 6
// avant de se poser, le nuage s'abaisse au-dessus du village et se resserre (pendant DESCENT secondes, à partir de
// quelques secondes avant les premiers posés) ; à l'envol, il se forme d'abord là, bas et serré, puis monte
const DESCENT = 7
const RISE = 6
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
// le plus grand retard d'un oiseau sur ceux de devant, en secondes (un virage traverse le nuage en une
// demi-seconde environ, comme chez les vrais étourneaux)
const MAX_LAG = 0.6
// (les retards sont rangés en quelques paliers : la pose de la nappe n'est calculée qu'une fois par palier)
const LAGS = 48
// chaque oiseau : sa place dans la nappe (u, v, dans un disque), son retard, et un peu de flottement à lui
const u = new Float32Array(COUNT)
const v = new Float32Array(COUNT)
const seed = new Float32Array(COUNT)
const lag = new Uint8Array(COUNT)
// l'écart de chaque oiseau à sa place, quand la souris l'a fait fuir (en pixels), et son élan
const ox = new Float32Array(COUNT)
const oy = new Float32Array(COUNT)
const ovx = new Float32Array(COUNT)
const ovy = new Float32Array(COUNT)
// la souris (loin de tout quand elle n'est pas sur la page), et la distance à laquelle les oiseaux la fuient
let mouseX = -1e5
let mouseY = -1e5
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
addEventListener('pointermove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
  wake()
})
document.documentElement.addEventListener('pointerleave', () => {
  mouseX = mouseY = -1e5
})
// (au doigt : quand il se lève, il n'est plus sur la page ; sinon, les oiseaux revenus à leur place sous le
// dernier endroit touché s'envoleraient sans fin)
addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'mouse') mouseX = mouseY = -1e5
})
// les oiseaux posés qu'on dérange en passant la souris dessus : quand ils se sont envolés (en secondes, horloge
// réelle), et combien de temps dure leur petit tour avant de revenir à leur place
const startled = new Float64Array(COUNT).fill(-1e9)
// (de quel côté il part : décidé une fois, au moment où il s'envole, à l'opposé de la souris ; ensuite il finit
// son tour sans s'occuper d'elle)
const startledSide = new Int8Array(COUNT).fill(1)
// (et chacun son tour, tiré au moment de l'envol : sa durée, sa hauteur, sa distance ; d'où il part, s'il change
// de place en se reposant)
const startledSpan = new Float32Array(COUNT)
const startledLift = new Float32Array(COUNT)
const startledDrift = new Float32Array(COUNT)
const startledFromX = new Float32Array(COUNT)
const startledFromY = new Float32Array(COUNT)
const STARTLE_NEAR = 46 // (en pixels autour de la souris)
const STARTLE_TIME = 2.2
// faire s'envoler l'oiseau i (posé, en x, y) à l'instant seconds, vers le côté side (1 : la droite, -1 : la
// gauche) : la plupart font un petit saut, quelques-uns vont un peu plus loin et plus haut ; un sur cinq se
// repose ailleurs, sur une place voisine
function startle(i: number, x: number, y: number, seconds: number, side: number) {
  const far = Math.random() ** 2 // (souvent petit, parfois grand)
  startled[i] = seconds
  startledSide[i] = side
  startledSpan[i] = STARTLE_TIME * (0.75 + 0.7 * far + 0.2 * Math.random())
  startledLift[i] = 40 + 110 * far + 25 * Math.random()
  startledDrift[i] = (25 + 95 * Math.random() ** 2) * side
  startledFromX[i] = x
  startledFromY[i] = y
  if (Math.random() < 0.2 && places.length) {
    const here = places.findIndex(([c]) => c >= perchCol[i])
    const reach = Math.round(places.length * (0.01 + 0.04 * far)) * side
    const [c, r] =
      places[Math.min(places.length - 1, Math.max(0, here + reach + Math.round((Math.random() - 0.5) * 6)))]
    perchCol[i] = c
    perchRow[i] = r
  }
}
// combien sont en l'air en ce moment après avoir été dérangés (tant qu'il y en a, on continue de dessiner)
let startledNow = 0
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
  // les oiseaux plongent par coulées : six groupes, selon leur place dans le nuage, du côté du village (u grand,
  // posés le plus à droite) vers l'autre ; chaque groupe d'un bloc, à une seconde près
  const band = Math.min(STREAMS - 1, Math.floor((1 - (u[i] + 1.5) / 3) * STREAMS))
  settle[i] = Math.max(0, band) * (LAND_SPREAD / STREAMS) + Math.random() * 1
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
  // la taille des caractères : 12 px, ou moins sur un écran étroit (téléphone), pour que le village tienne en
  // entier dans la largeur (un caractère de JetBrains Mono fait 0,6 fois sa taille de large)
  const size = Math.max(5, Math.min(12, Math.floor((innerWidth - 16) / (VILLAGE_W + 2) / 0.6)))
  document.documentElement.style.setProperty('--mm-size', `${size}px`)
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
  villageCol = Math.max(0, cols - VILLAGE_W - Math.round(Math.min(32, Math.max(8, innerWidth * 0.024)) / cellW))
  villageRow = rows - VILLAGE_LINES.length
  village.style.left = `${villageCol * cellW}px`
  village.style.top = `${skyTop + villageRow * cellH}px`
  perches()
}

// ——— Où se poser : sur les toits du village et la pointe du clocher, et sur le bas de la page, à gauche du
// village ———
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
  for (let changed = true; changed;) {
    changed = false
    for (let x = 0; x < VILLAGE_W; x++) {
      if (row[x] && !SKY[y][x] && (SKY[y][x - 1] || SKY[y][x + 1])) changed = SKY[y][x] = true
    }
  }
})
// la dernière ligne de l'église (le bas de sa façade)
const CHURCH_BASE = VILLAGE_LINES.findIndex((line) => line.includes('|________|'))
// toutes les places (colonne, ligne), de gauche à droite
let places: [number, number][] = []
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
  places = [...ground, ...roofs].sort((a, b) => a[0] - b[0])
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
  // (lentement : vu de loin, le nuage traverse le ciel en une minute ou deux)
  const cx = W * (0.46 + 0.18 * Math.sin(t * 0.07) + 0.07 * Math.sin(t * 0.16 + 1) + 0.03 * Math.sin(t * 0.31))
  const cy = H * (0.36 + 0.08 * Math.sin(t * 0.09 + 1) + 0.04 * Math.sin(t * 0.21) + 0.02 * Math.sin(t * 0.45 + 2))
  // la nappe tourne sur elle-même (lacet, tangage, roulis) : comme un vrai vol, elle vire en quelques secondes
  const yaw = t * 0.25 + 1.2 * Math.sin(t * 0.35) + 0.5 * Math.sin(t * 0.9 + 2)
  const pitch = 0.9 * Math.sin(t * 0.5 + 0.4) + 0.35 * Math.sin(t * 1.1)
  const roll = 0.6 * Math.sin(t * 0.4 + 2) + 0.25 * Math.sin(t * 0.95 + 1)
  // le faucon : toutes les vingt secondes, une vague traverse la nappe en une seconde
  const hunt = t % 20
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
    stretchX: 1 + 0.25 * Math.sin(t * 0.6) + 0.1 * Math.sin(t * 1.4 + 1),
    stretchY: 0.55 + 0.18 * Math.sin(t * 0.5 + 2) + 0.07 * Math.sin(t * 1.2),
    bend: 1.0 * Math.sin(t * 0.45 + 1) + 0.4 * Math.sin(t * 1.1 + 3),
    wave: hunt < 1 ? -1.6 + hunt * 3.2 : 99,
    t,
  }
}

// ——— Le ciel à l'instant t (temps du vol) ———
const poses: Pose[] = []
function draw(t: number, now: number) {
  const W = innerWidth
  const H = innerHeight
  const { landAt, liftAt } = cycle(now)
  // près du village : 0 en plein ciel, 1 bas et serré au-dessus des toits (juste après l'envol, et avant de se
  // poser)
  const ease = (x: number) => {
    const c = clamp(x)
    return c * c * (3 - 2 * c)
  }
  const low = Math.max(
    ease((now - (landAt - DESCENT + 2)) / DESCENT),
    liftAt !== null && now < landAt ? 1 - ease((now - liftAt) / RISE) : 0,
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
    const jump = Math.abs(mouseX - lastX) > 300 || Math.abs(mouseY - lastY) > 300
    moveX = jump ? 0 : moveX * 0.6 + (mouseX - lastX) * 0.4
    moveY = jump ? 0 : moveY * 0.6 + (mouseY - lastY) * 0.4
    lastX = mouseX
    lastY = mouseY
  }
  const speed = Math.hypot(moveX, moveY)
  const sideX = speed ? -moveY / speed : 0
  const sideY = speed ? moveX / speed : 0
  // (plus elle va vite, plus elle fait peur, jusqu'à une limite)
  const fright = Math.min(1, speed / 25)
  waves = waves.filter((w) => seconds - w.at < WAVE_LIFE)
  let touched = -1
  let touchedD2 = FEAR * FEAR
  startledNow = 0
  for (let i = 0; i < COUNT; i++) {
    // posé ou non : 0 en vol, 1 posé (en train de se poser, ou de redécoller : entre les deux)
    const land =
      now >= landAt
        ? clamp((now - landAt - settle[i]) / LAND_TIME)
        : liftAt !== null
          ? 1 - clamp((now - liftAt - settle[i] * 0.3) / LIFT_TIME)
          : 0
    if (land === 1) {
      // posé : la souris passe tout près ? il s'envole en sursaut, fait un tour dans le ciel en s'écartant d'elle,
      // et revient se poser (à sa place, ou ailleurs)
      const homeX = (perchCol[i] + 0.5) * cellW
      const homeY = skyTop + (perchRow[i] + 0.5) * cellH
      let age = seconds - startled[i]
      if (age > startledSpan[i] + 0.5 && (homeX - mouseX) ** 2 + (homeY - mouseY) ** 2 < STARTLE_NEAR ** 2) {
        startle(i, homeX, homeY, seconds - Math.random() * 0.15, homeX >= mouseX ? 1 : -1)
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
      const dx = px + ox[i] - mouseX
      const dy = py + oy[i] - mouseY
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
}

// ——— Voler, ou rester figé, ou avancer image par image ———
// clock : le temps de vol, en secondes (il n'avance que quand les oiseaux volent, ou quand on fait défiler) ; la
// nappe part d'un instant où elle est belle
let clock = 0
const show = () => draw(14 + clock, clock)
// le vol arrêté (posés, ou figé), on dessine quand même tant que la souris bouge ou que des oiseaux dérangés
// sont en l'air
let idle = 0
let lastMove = 0
function wake() {
  lastMove = performance.now()
  if (!flying && !idle) idle = requestAnimationFrame(idleFrame)
}
// des oiseaux qui ne tiennent pas en place : de temps en temps, quand tous sont posés, un ou deux s'envolent
// d'un toit tout seuls, font leur petit tour et se reposent (comme dans un vrai dortoir d'étourneaux ; et ça dit,
// sans un mot, qu'ils peuvent s'envoler)
function restless() {
  if (!flying && landed(clock) && cols) {
    const seconds = performance.now() / 1000
    const n = Math.random() < 0.4 ? 2 : 1
    for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
      const i = Math.floor(Math.random() * COUNT)
      // (sur un toit, pas sur le bas de la page ; et pas déjà en l'air)
      if (perchRow[i] >= rows - 1 || seconds - startled[i] < startledSpan[i] + 0.5) continue
      startle(
        i,
        (perchCol[i] + 0.5) * cellW,
        skyTop + (perchRow[i] + 0.5) * cellH,
        seconds + k * 0.2,
        Math.random() < 0.5 ? 1 : -1,
      )
      k++
    }
    if (!idle) idle = requestAnimationFrame(idleFrame)
  }
  setTimeout(restless, 4000 + Math.random() * 6000)
}
setTimeout(restless, 3000)
function idleFrame() {
  idle = 0
  if (flying) return
  show()
  if (startledNow > 0 || performance.now() - lastMove < 200) idle = requestAnimationFrame(idleFrame)
}
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
