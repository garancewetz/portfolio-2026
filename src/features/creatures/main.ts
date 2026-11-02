import './creatures.css'
import { mount } from '@/features/carnet/carnet'
import type { Creature } from './art'
import { C2 } from './bestiary-2'
import { C3 } from './bestiary-3'
import { C4 } from './bestiary-4'
import { stage } from './stage'

// Créatures : une planche de créatures en caractères, pour en choisir une qui habitera Ruban. Une ligne par
// créature : son numéro, son nom et un mot sur elle, puis sa piste, où elle fait des allers-retours (elle marche,
// grimpe un peu au mur du bout, saute, s'accroupit en se recevant, et repart ; voir stage.ts). Un clic sur le nom la
// garde (et un autre la rend) ; celles qu'on garde sont rappelées en haut, par leur numéro, et restent gardées dans
// ce navigateur.

// la ligne du carnet (le labo, la page, les voisines)
mount()

const CREATURES: Creature[] = [...C2, ...C3, ...C4]
const list = document.querySelector<HTMLElement>('.cr-list')!
const picked = document.querySelector<HTMLElement>('.cr-picked')!

// les créatures gardées (leur numéro)
const KEY = 'creatures.gardees'
let kept = new Set<number>()
try {
  kept = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[])
} catch {
  // (pas de mémoire ici : on garde pour la visite)
}
// (une créature retirée de la planche n'est plus gardée)
for (const n of kept) if (!CREATURES.some((c) => c.n === n)) kept.delete(n)
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...kept]))
  } catch {
    // (pas de mémoire ici)
  }
  const nums = [...kept].sort((a, b) => a - b)
  picked.textContent = nums.length
    ? `gardées : ${nums.map((n) => `${n} (${CREATURES.find((c) => c.n === n)?.name})`).join(', ')}`
    : ''
}

// (toutes les poses d'une créature dans la même boîte : la plus large, la plus haute ; elle ne saute pas d'une pose
// à l'autre)
const box = (c: Creature) => {
  const poses = [c.idle, c.walk, c.jump, c.climb, c.climb2, c.crouch]
  return { w: Math.max(...poses.flat().map((l) => l.length)), h: Math.max(...poses.map((p) => p.length)) }
}

const rows = CREATURES.map((c) => {
  const { n } = c
  const { w, h } = box(c)
  const li = document.createElement('li')
  li.className = 'cr-row'
  li.innerHTML = `
    <button type="button" class="cr-pick" aria-pressed="false">
      <span class="cr-num">${String(n).padStart(2, '0')}</span>
      <span class="cr-name">${c.name}</span>
      <span class="cr-note">${c.note}</span>
    </button>
    <figure class="cr-lane" style="--h: ${h}">
      <pre class="cr-art" aria-hidden="true" style="--w: ${w}ch; --h: ${h}"></pre>
      <figcaption></figcaption>
    </figure>`
  const button = li.querySelector<HTMLButtonElement>('.cr-pick')!
  const show = () => {
    button.setAttribute('aria-pressed', String(kept.has(n)))
    li.classList.toggle('is-kept', kept.has(n))
  }
  button.addEventListener('click', () => {
    if (kept.has(n)) kept.delete(n)
    else kept.add(n)
    show()
    save()
  })
  show()
  list.append(li)
  const lane = li.querySelector<HTMLElement>('.cr-lane')!
  return stage(lane, lane.querySelector('.cr-art')!, lane.querySelector('figcaption')!, c, w, h)
})
save()

// l'animation : chaque créature fait un pas sur sa piste, à chaque image (sans animation si on l'a demandé au
// système : elles restent où elles sont)
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const step of rows) step(dt)
  requestAnimationFrame(frame)
}
if (matchMedia('(prefers-reduced-motion: reduce)').matches) for (const step of rows) step(0)
else requestAnimationFrame(frame)
