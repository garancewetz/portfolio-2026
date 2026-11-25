import './kit.css'
import { mount } from '@/features/carnet/carnet'
import { LOOKS, type LookName } from './looks'
import { stage } from './stage'

// Kit: Pousse, the mascot of Kit (the tool that takes a ticket from start to finish), in 3D (three.js), as it is in
// Kit itself (see looks.ts). First the six steps of a ticket in a line on the sea of clouds, a thread running from
// one to the next, each with its number and its name; below, smaller, its other looks. Each floats on its own little
// stage (see stage.ts).

// the notebook's line (the lab, the page number, the neighbours)
mount()

// the names are shown in French, like the site
const STEPS: [LookName, string][] = [
  ['ticket', 'Plan'],
  ['think', 'Implémentation'],
  ['camera', 'Vidéo'],
  ['audit', 'Audit'],
  ['plane', 'PR'],
  ['bloom', 'Livré'],
]
const OTHERS: [LookName, string][] = [
  ['mint', 'Au repos'],
  ['asleep', 'Endormi'],
  ['offline', 'Hors ligne'],
  ['approval', 'Validation demandée'],
  ['checks', 'CI rouge'],
  ['heavy', 'Session lourde'],
  ['review', 'Relecture demandée'],
  ['feedback', 'Retour sur la PR'],
]

const still = matchMedia('(prefers-reduced-motion: reduce)').matches

function fill(list: HTMLElement, looks: [LookName, string][], numbered: boolean) {
  looks.forEach(([look, name], i) => {
    const place = document.createElement('li')
    place.className = 'kit-step'
    place.innerHTML = `<canvas aria-hidden="true"></canvas>${numbered ? `<span class="kit-n">${i + 1}</span>` : ''}<b>${name}</b>`
    list.append(place)
    stage(place.querySelector('canvas')!, LOOKS[look](), still)
  })
}

fill(document.querySelector<HTMLElement>('.kit-line')!, STEPS, true)
fill(document.querySelector<HTMLElement>('.kit-moods')!, OTHERS, false)
