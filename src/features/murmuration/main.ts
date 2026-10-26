import './murmuration.css'
import { mount } from '@/features/carnet/carnet'
import { local, sheet } from '@/features/carnet/sheet'
import { land, landed, landing, lift, settings } from './flock'
import { VILLAGE_W, grid, resize } from './grid'
import { perchCol, perchRow, perches } from './perches'
import { startle, startled, startledSpan } from './startle'
import { draw, mouse } from './draw'
import { settingsGear } from './settings'

// Murmuration : un vol d'étourneaux, dessiné en caractères sur toute la page, au-dessus d'un village perché.
// Au départ, les oiseaux sont posés sur les toits du village et sur le bas de la page. Un clic n'importe où les
// fait s'envoler : ils font leur murmuration, puis, au bout de vingt-cinq secondes, le nuage s'abaisse au-dessus
// du village, se resserre, et les oiseaux plongent se poser par coulées. Un clic en plein vol les fait se poser
// tout de suite ; posés, un autre clic les fait repartir, et ainsi de suite.
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
//
// Les morceaux : grid.ts (la grille du ciel), flock.ts (les oiseaux et le déroulé du vol), perches.ts (où ils se
// posent), startle.ts (les envols en sursaut), pose.ts (la forme de la nappe), draw.ts (le dessin de chaque image).

// en vol (la boucle d'animation tourne) ou non (posés, ou vol figé) ; la boucle et son dernier instant
let flying = false
let frame = 0
let last = 0
// combien sont en l'air en ce moment après avoir été dérangés (tant qu'il y en a, on continue de dessiner)
let startledNow = 0

addEventListener('pointermove', (e) => {
  ;({ x: mouse.x, y: mouse.y } = local(e))
  wake()
})
document.documentElement.addEventListener('pointerleave', () => {
  mouse.x = mouse.y = -1e5
})
// (au doigt : quand il se lève, il n'est plus sur la page ; sinon, les oiseaux revenus à leur place sous le
// dernier endroit touché s'envoleraient sans fin)
// un appui (souris ou doigt) qui se relève sans avoir glissé : c'est un clic (au doigt, sur un téléphone, le « clic »
// du navigateur n'arrive pas toujours sur une page sans lien ni bouton)
let downX = 0
let downY = 0
addEventListener('pointerdown', (e) => {
  downX = e.clientX
  downY = e.clientY
})
addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) < 12) {
    const { x, y } = local(e)
    press(x, y)
  }
  if (e.pointerType !== 'mouse') mouse.x = mouse.y = -1e5
})

// ——— Voler, ou rester figé, ou avancer image par image ———
// clock : le temps de vol, en secondes (il n'avance que quand les oiseaux volent, ou quand on fait défiler) ; la
// nappe part d'un instant où elle est belle
let clock = 0
const show = () => (startledNow = draw(14 + clock, clock, flying))
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
  if (!flying && landed(clock) && grid.cols) {
    const seconds = performance.now() / 1000
    const n = Math.random() < 0.4 ? 2 : 1
    for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
      const i = Math.floor(Math.random() * settings.count)
      // (sur un toit, pas sur le bas de la page ; et pas déjà en l'air)
      if (perchRow[i] >= grid.rows - 1 || seconds - startled[i] < startledSpan[i] + 0.5) continue
      startle(
        i,
        (perchCol[i] + 0.5) * grid.cellW,
        grid.skyTop + (perchRow[i] + 0.5) * grid.cellH,
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
  if (last) clock += Math.min(0.1, (now - last) / 1000) * settings.speed
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
// un clic : posés (tous, ou en train de se poser), les faire s'envoler ; en plein vol, les faire se reposer (si le
// vol a été figé en faisant défiler, il le relance)
function press(x = (grid.villageCol + VILLAGE_W / 2) * grid.cellW, y = sheet().h) {
  if (landed(clock) || landing(clock)) {
    lift(clock, x, y)
    if (!flying) toggle()
  } else if (!flying) toggle()
  else land(clock)
}
addEventListener('keydown', (e) => {
  // Espace ou Entrée : comme un clic
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
  perches()
  show()
})

document.fonts.ready.then(() => {
  resize()
  perches()
  show()
})

// la page dans le carnet (voir features/carnet), avec sa roue crantée (voir settings.ts)
const nav = mount()
if (nav) settingsGear(nav, show)
