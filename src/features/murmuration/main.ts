import './murmuration.css'
import { VILLAGE } from './village'

// Murmuration : un vol d'étourneaux, dessiné en caractères sur toute la page, au-dessus d'un village perché.
// Au départ, le vol attend hors de la page, à gauche ; un clic n'importe où le fait arriver et voler (un autre
// clic le fige, un autre encore le relance).
//
// Vu de loin, un vol d'étourneaux est une grande nappe d'oiseaux en trois dimensions : là où elle se plie, ou
// quand on la voit par la tranche, les oiseaux se superposent et le nuage s'assombrit ; quand elle s'ouvre, il
// s'éclaircit. Ici, chaque oiseau a sa place dans une nappe qui ondule, se tord et tourne lentement en dérivant
// dans le ciel ; de temps en temps, un faucon passe et une vague la traverse.
// Le ciel est une grille de caractères : plus il y a d'oiseaux dans une case, plus le signe est dense.

const sky = document.querySelector<HTMLPreElement>('.mm-sky')!
document.querySelector<HTMLPreElement>('.mm-village')!.textContent = VILLAGE

// du plus clair au plus dense
const RAMP = ' .,:;vwWM'
// le nombre d'oiseaux par case qui fait passer au signe suivant
const PER_STEP = 1.6

const COUNT = 4500
// chaque oiseau : sa place dans la nappe (u, v, dans un disque), et un peu d'agitation à lui
const u = new Float32Array(COUNT)
const v = new Float32Array(COUNT)
const seed = new Float32Array(COUNT)
for (let i = 0; i < COUNT; i++) {
  const a = Math.random() * Math.PI * 2
  // (un disque aux bords effilochés : quelques oiseaux isolés autour du nuage)
  const r = i % 16 === 0 ? 1 + 0.5 * Math.random() : Math.sqrt(Math.random())
  u[i] = r * Math.cos(a) * (1 + 0.15 * Math.random())
  v[i] = r * Math.sin(a) * (1 + 0.15 * Math.random())
  seed[i] = Math.random() * 1000
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

// ——— Le ciel à l'instant t (en secondes) ———
function draw(t: number, arrival: number) {
  const W = innerWidth
  const H = innerHeight
  const R = Math.min(W, H) * 0.36
  // le centre du vol dérive dans le haut du ciel, au-dessus du village
  let cx = W * (0.46 + 0.2 * Math.sin(t * 0.05) + 0.06 * Math.sin(t * 0.13))
  // l'arrivée : au départ, le vol attend hors de la page, à gauche (seuls quelques oiseaux isolés dépassent) ; au
  // premier clic, il entre lentement et rejoint sa route en ralentissant (vingt-cinq secondes)
  const e = 1 - Math.pow(1 - Math.min(1, arrival / 25), 3)
  cx = -R * 1.35 + (cx + R * 1.35) * e
  const cy = H * (0.36 + 0.09 * Math.sin(t * 0.07 + 1) + 0.03 * Math.sin(t * 0.21))
  // la nappe tourne lentement sur elle-même (lacet, tangage, roulis)
  const yaw = t * 0.09 + 1.6 * Math.sin(t * 0.05)
  const pitch = 1.1 * Math.sin(t * 0.11 + 0.4)
  const roll = 0.7 * Math.sin(t * 0.08 + 2)
  const cyw = Math.cos(yaw), syw = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const cr = Math.cos(roll), sr = Math.sin(roll)
  // elle s'étire et se resserre, et se plie plus ou moins
  const stretchX = 1 + 0.3 * Math.sin(t * 0.17)
  const stretchY = 0.55 + 0.2 * Math.sin(t * 0.13 + 2)
  const bend = 1.1 * Math.sin(t * 0.12 + 1)
  // le faucon : toutes les vingt secondes environ, une vague traverse la nappe en trois secondes
  const hunt = (t % 21) / 3
  const wave = hunt < 1 ? -1.6 + hunt * 3.2 : 99

  density.fill(0)
  for (let i = 0; i < COUNT; i++) {
    const a = u[i]
    const b = v[i]
    let X = a * R * stretchX
    let Y = b * R * stretchY
    // les ondulations qui parcourent la nappe
    let Z = R * (0.3 * Math.sin(2.6 * a + t * 0.9) + 0.22 * Math.sin(2.1 * b - t * 0.7 + 1) + 0.12 * Math.sin(4 * (a + b) + t * 1.3))
    // le passage du faucon : les oiseaux s'écartent, la nappe se creuse
    const dw = a - wave
    if (dw > -0.5 && dw < 0.5) {
      const k = Math.exp(-dw * dw * 30)
      Z -= R * 0.45 * k
      Y += R * 0.12 * k * Math.sign(b)
    }
    // la nappe plie (plus loin du centre, plus elle se recourbe)
    const th = bend * a
    const ct = Math.cos(th), st = Math.sin(th)
    ;[X, Z] = [X * ct - Z * st, X * st + Z * ct]
    // chaque oiseau s'agite un peu autour de sa place
    const s = seed[i]
    X += 3 * Math.sin(s + t * 2.3)
    Y += 3 * Math.cos(s * 1.7 + t * 1.9)
    // la nappe tourne (roulis, tangage, lacet)
    const x1 = X * cr - Y * sr
    const y1 = X * sr + Y * cr
    const y2 = y1 * cp - Z * sp
    const z2 = y1 * sp + Z * cp
    const x3 = x1 * cyw + z2 * syw
    // vue de loin, de face : on garde x et y
    const c = Math.floor((cx + x3) / cellW)
    const r = Math.floor((cy + y2) / cellH)
    if (c >= 0 && c < cols && r >= 0 && r < rows) density[r * cols + c]++
  }

  let text = ''
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const d = density[r * cols + c]
      line += d === 0 ? ' ' : RAMP[Math.min(RAMP.length - 1, 1 + Math.floor((d - 1) / PER_STEP))]
    }
    text += line + '\n'
  }
  sky.textContent = text
}

// ——— Voler, ou rester figé ———
// t : le temps du vol (il n'avance que quand les oiseaux volent) ; on part d'un instant où la nappe est belle
let t = 14
const SLOW = 0.4
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
    // (le vol avance plus lentement que l'horloge : une murmuration flotte, elle ne file pas)
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
