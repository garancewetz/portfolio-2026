import './creatures.css'
import { mount } from '@/features/carnet/carnet'
import type { Creature, Pose } from './art'
import { C1 } from './bestiary-1'
import { C2 } from './bestiary-2'
import { C3 } from './bestiary-3'
import { C4 } from './bestiary-4'

// Créatures : une planche de créatures en caractères, pour en choisir une qui habitera Ruban. Chacune passe
// en boucle par ses poses (au repos, en marche, au repos, en marche, en plein saut, en train de grimper), et dit
// laquelle sous elle. Un clic la garde (et un autre la rend) ; celles qu'on garde sont rappelées en haut, par leur
// numéro, et restent gardées dans ce navigateur.

// la ligne du carnet (le labo, la page, les voisines)
mount()

const CREATURES: Creature[] = [...C1, ...C2, ...C3, ...C4]
const grid = document.querySelector<HTMLElement>('.cr-grid')!
const picked = document.querySelector<HTMLElement>('.cr-picked')!

// les poses, dans l'ordre où on les voit, et leur nom
const CYCLE: { key: keyof Pick<Creature, 'idle' | 'walk' | 'jump' | 'climb'>; label: string }[] = [
  { key: 'idle', label: 'repos' },
  { key: 'walk', label: 'marche' },
  { key: 'idle', label: 'marche' },
  { key: 'walk', label: 'marche' },
  { key: 'jump', label: 'saut' },
  { key: 'climb', label: 'grimpe' },
]

// les créatures gardées (leur numéro, à partir de 1)
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
  const list = [...kept].sort((a, b) => a - b)
  picked.textContent = list.length
    ? `gardées : ${list.map((n) => `${n} (${CREATURES.find((c) => c.n === n)?.name})`).join(', ')}`
    : ''
}

// (toutes les poses d'une créature dans la même boîte : la plus large, la plus haute ; elle ne saute pas d'une pose à
// l'autre)
const box = (c: Creature) => {
  const poses = [c.idle, c.walk, c.jump, c.climb]
  return { w: Math.max(...poses.flat().map((l) => l.length)), h: Math.max(...poses.map((p) => p.length)) }
}
const pad = (p: Pose, h: number) => [...Array(h - p.length).fill(''), ...p].join('\n')

const cards = CREATURES.map((c) => {
  const { n } = c
  const li = document.createElement('li')
  li.className = 'cr-card'
  const { w, h } = box(c)
  li.innerHTML = `
    <button type="button" class="cr-pick" aria-pressed="false">
      <span class="cr-num">${String(n).padStart(2, '0')}</span>
      <pre class="cr-art" aria-hidden="true" style="--w: ${w}ch; --h: ${h}"></pre>
      <span class="cr-pose" aria-hidden="true"></span>
      <span class="cr-name">${c.name}</span>
      <span class="cr-note">${c.note}</span>
    </button>`
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
  grid.append(li)
  return { c, h, art: li.querySelector<HTMLElement>('.cr-art')!, pose: li.querySelector<HTMLElement>('.cr-pose')! }
})
save()

// l'animation : une pose toutes les 420 ms ; chaque créature un peu décalée, pour que la planche vive sans marcher au pas
let step = 0
function tick() {
  cards.forEach(({ c, h, art, pose }, i) => {
    const { key, label } = CYCLE[(step + i) % CYCLE.length]
    art.textContent = pad(c[key], h)
    pose.textContent = label
  })
  step++
}
tick()
// (sans animation si on l'a demandé au système : la pose de repos seulement)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(tick, 420)
