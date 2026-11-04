import './creatures.css'
import { mount } from '@/features/carnet/carnet'
import type { Creature } from './art'
import { C1 } from './bestiary-1'
import { C2 } from './bestiary-2'
import { C3 } from './bestiary-3'
import { C4 } from './bestiary-4'
import { C7 } from './bestiary-7'
import { watch } from './presence'
import { landscape } from './land'
import { trails } from './trails'
import { roam, type Body } from './stage'
import { switcher } from './theme'

// Créatures : les créatures en caractères, en liberté sur les trois lignes d'un paysage (des collines, un fil entre
// des poteaux : voir land.ts), de la largeur de la page. Chacune va de son côté : elle marche, s'arrête, saute, grimpe, glisse dans les descentes, vole, fait
// attention aux autres et au visiteur, tire un trait de sa couleur, dort la nuit (voir stage.ts).

// la ligne du carnet (le labo, la page, les voisines), et le bouton du jour et de la nuit
switcher(mount())

const CREATURES: Creature[] = [...C1, ...C2, ...C3, ...C4, ...C7]
const room = document.querySelector<HTMLElement>('.cr')!
const land = landscape(room)
// (où chacune se trouve : pour qu'elles se remarquent)
const bodies: Body[] = []
const draw = trails(room, CREATURES.length)
// (le visiteur : elles le remarquent)
watch(room)

// (toutes les poses d'une créature dans la même boîte : la plus large, la plus haute ; elle ne saute pas d'une pose
// à l'autre)
const box = (c: Creature) => {
  const poses = [c.idle, c.walk, c.jump, c.climb, c.climb2, c.crouch, ...(c.fly ?? [])]
  return { w: Math.max(...poses.flat().map((l) => l.length)), h: Math.max(...poses.map((p) => p.length)) }
}

const steps = CREATURES.map((c, i) => {
  const { w, h } = box(c)
  const art = document.createElement('pre')
  art.className = 'cr-art'
  art.setAttribute('aria-label', c.name)
  room.append(art)
  return roam(room, art, c, w, h, land, bodies, (x, y) => draw.print(i, x, y))
})

// l'animation : chaque créature fait un pas, à chaque image (sans animation si on l'a demandé au système : elles
// restent où elles sont)
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const step of steps) step(dt)
  land.draw(dt)
  draw.paint()
  requestAnimationFrame(frame)
}
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const step of steps) step(0)
  land.draw(0)
  draw.paint()
} else requestAnimationFrame(frame)
