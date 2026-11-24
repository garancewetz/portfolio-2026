import './kit.css'
import { mount } from '@/features/carnet/carnet'
import { pousseFor } from './pousse'
import { stage } from './stage'

// Kit: Pousse, the mascot of Kit (the tool that takes a ticket from start to finish), in 3D (three.js). One mascot
// for every step: its colour and what it holds tell which (see pousse.ts, props.ts); once shipped, its sprout
// flowers. Each floats on its own little stage (see stage.ts).

// the notebook's line (the lab, the page number, the neighbours)
mount()

// the steps of a ticket, in order; the names are shown in French, like the site
const STEPS = [
  { name: 'Plan', build: () => pousseFor({ skin: 0x5aaef0, prop: 'ticket' }) },
  { name: 'Implémentation', build: () => pousseFor({}) },
  { name: 'Vidéo', build: () => pousseFor({ skin: 0xff7f66, prop: 'camera' }) },
  { name: 'Audit', build: () => pousseFor({ skin: 0xffaa2e, prop: 'toolbox' }) },
  { name: 'PR', build: () => pousseFor({ skin: 0x9283f0, prop: 'plane' }) },
  { name: 'Livré', build: () => pousseFor({ bloom: true }) },
]

const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const grid = document.querySelector<HTMLElement>('.kit-grid')!
for (const step of STEPS) {
  const card = document.createElement('figure')
  card.className = 'kit-card'
  card.innerHTML = `<canvas aria-hidden="true"></canvas><figcaption>${step.name}</figcaption>`
  grid.append(card)
  stage(card.querySelector('canvas')!, step.build(), still)
}
