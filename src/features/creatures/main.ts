import './creatures.css'
import { mount } from '@/features/carnet/carnet'
import type { Creature, Pose } from './art'
import { C1 } from './bestiary-1'
import { C2 } from './bestiary-2'
import { C3 } from './bestiary-3'
import { C4 } from './bestiary-4'

// Créatures : une planche de créatures en caractères, pour en choisir une qui habitera Ruban. Une ligne par
// créature : son numéro, son nom et un mot sur elle, puis quatre cases qui bougent en boucle, chacune pour un geste
// (elle marche, elle saute, elle grimpe, elle s'accroupit). Un clic sur le nom la garde (et un autre la rend) ;
// celles qu'on garde sont rappelées en haut, par leur numéro, et restent gardées dans ce navigateur.

// la ligne du carnet (le labo, la page, les voisines)
mount()

const CREATURES: Creature[] = [...C1, ...C2, ...C3, ...C4]
const list = document.querySelector<HTMLElement>('.cr-list')!
const picked = document.querySelector<HTMLElement>('.cr-picked')!

type Key = keyof Pick<Creature, 'idle' | 'walk' | 'jump' | 'climb' | 'climb2' | 'crouch'>
// les quatre cases : leur geste, et les poses qui passent dedans, en boucle (une toutes les 420 ms)
const CELLS: { label: string; poses: Key[] }[] = [
  { label: 'marche', poses: ['idle', 'walk'] },
  { label: 'saute', poses: ['idle', 'crouch', 'jump', 'jump'] },
  { label: 'grimpe', poses: ['climb', 'climb2'] },
  { label: 's’accroupit', poses: ['idle', 'idle', 'crouch', 'crouch'] },
]

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

// (toutes les poses d'une créature dans la même boîte : la plus large, la plus haute ; elle ne saute pas d'une case
// ou d'une pose à l'autre)
const box = (c: Creature) => {
  const poses = [c.idle, c.walk, c.jump, c.climb, c.climb2, c.crouch]
  return { w: Math.max(...poses.flat().map((l) => l.length)), h: Math.max(...poses.map((p) => p.length)) }
}
const pad = (p: Pose, h: number) => [...Array(h - p.length).fill(''), ...p].join('\n')

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
    ${CELLS.map(
      ({ label }) => `
      <figure class="cr-cell">
        <pre class="cr-art" aria-hidden="true" style="--w: ${w}ch; --h: ${h}"></pre>
        <figcaption>${label}</figcaption>
      </figure>`,
    ).join('')}`
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
  return { c, h, arts: [...li.querySelectorAll<HTMLElement>('.cr-art')] }
})
save()

// l'animation : chaque case passe à sa pose suivante ; chaque ligne un peu décalée, pour que la planche vive sans
// marcher au pas
let step = 0
function tick() {
  rows.forEach(({ c, h, arts }, i) => {
    CELLS.forEach(({ poses }, k) => {
      arts[k].textContent = pad(c[poses[(step + i) % poses.length]], h)
    })
  })
  step++
}
tick()
// (sans animation si on l'a demandé au système : la première pose de chaque case)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(tick, 420)
