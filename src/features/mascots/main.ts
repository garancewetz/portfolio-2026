import './mascots.css'
import { C1 } from '@/features/creatures/bestiary-1'
import { C2 } from '@/features/creatures/bestiary-2'
import { C3 } from '@/features/creatures/bestiary-3'
import { C4 } from '@/features/creatures/bestiary-4'
import { C7 } from '@/features/creatures/bestiary-7'
import { mount } from '@/features/carnet/carnet'
import { dye } from './fur'
import { freed, keepFlying, lastSeen, remember } from './roam'
import { ROSTER } from './roster'
import { sky } from './sky'
import { stage } from './stage'

// Mascottes: the creatures of the lab's Créatures page, in 3D, standing in a line on the sea of clouds, each under the
// ASCII it comes from: the armless yeti, two ways (Yétou, Yéta), then the robot, the mouse, the goblin, the owl, the
// otter, the sloth. « libérer » (or a click on it) frees one: it flies off over the page, and only its ASCII is left in
// its place; it stays free on the whole site (roam.ts), coming back to this page too, until « rappeler » brings it
// home. A few dyes for each one's fur. The visible text is in French.

// the notebook's line (the lab, the page number, the neighbours)
mount()

// the ASCII of a creature of the Créatures page, at rest
const BESTIARY = [...C1, ...C2, ...C3, ...C4, ...C7]
const asciiOf = (name: string) => BESTIARY.find((c) => c.name === name)!.idle.join('\n')

// dyes for their fur (each creature also has its own colour: roster.ts)
const DYES: [label: string, color: string][] = [['blanc', '#ffffff'], ['rose', '#ff4fa3'], ['menthe', '#12d89c'], ['violet', '#8f5bff'], ['soleil', '#ffc21a']]

const line = document.querySelector<HTMLElement>('.mascots-line')!
// a place in the line: the ASCII it comes from, the creature (a button: free it, call it back), its name, its dyes
function place(name: string, note: string, ascii: string, dyes: (string | null)[]) {
  const figure = document.createElement('figure')
  figure.className = 'mascots-place'
  figure.innerHTML = `<pre class="mascots-ascii" aria-hidden="true"></pre>
    <button class="mascots-stage" tabindex="-1" aria-hidden="true"><canvas aria-hidden="true"></canvas></button>
    <figcaption><b>${name}</b><span>${note}</span></figcaption>
    <button class="mascots-act">libérer</button>
    <div class="mascots-dyes">${dyes.map((c, k) => `<button class="mascots-dye${k ? '' : ' on'}" aria-pressed="${!k}" style="--c:${c ?? '#ffffff'}" data-k="${k}" aria-label="${k ? DYES.find(([, d]) => d === c)![0] : 'sa couleur'}"></button>`).join('')}</div>`
  figure.querySelector('pre')!.textContent = ascii
  line.append(figure)
  return figure
}

// every creature, in order: its name, a word, its ASCII
const YETI_ASCII = asciiOf('yéti oreilles sans bras')
const YETI_WORDS: Record<string, string> = { Yétou: 'sur l’ASCII', Yéta: 'en fourrure' }
const ENTRIES = ROSTER.map((m) => {
  if (m.key in YETI_WORDS) return { ...m, name: m.key, line: YETI_WORDS[m.key], ascii: YETI_ASCII }
  const { name, note } = BESTIARY.find((c) => c.name === m.key)!
  return { ...m, name: name[0].toUpperCase() + name.slice(1), line: note, ascii: asciiOf(m.key) }
})

// « tous les libérer », or « tous les rappeler » when they are all out
const all = document.querySelector<HTMLButtonElement>('.mascots-all')!
const out: (() => boolean)[] = []
const label = () => (all.textContent = out.every((isOut) => isOut()) ? 'tous les rappeler' : 'tous les libérer')

const flight = sky(ENTRIES.map((e) => e.flier))
keepFlying(flight, ENTRIES.map((e) => e.key))
// those out since another page: where they were flying a moment ago
const seen = lastSeen()
const toggles = ENTRIES.map((entry, i) => {
  // its own colour first, then the dyes it does not already wear
  const dyes = [entry.own, ...DYES.map(([, c]) => c).filter((c) => c !== (entry.own ?? '#ffffff'))]
  const figure = place(entry.name, entry.line, entry.ascii, dyes)
  const canvas = figure.querySelector('canvas')!
  const button = figure.querySelector<HTMLButtonElement>('.mascots-stage')!
  const act = figure.querySelector<HTMLButtonElement>('.mascots-act')!
  act.setAttribute('aria-label', `libérer ${entry.name}`)
  const home = stage(canvas, entry.build())
  // out: how to call it back; landing: on its way back
  let recall: ((landed: () => void) => void) | null = null
  let landing = false
  // the colour it wears (out, the site remembers it in this colour)
  let worn = entry.own
  const wear = (color: string | null) => {
    worn = color
    dye(home.piece.object, color)
    dye(flight.piece(i).object, color)
    if (recall) remember(entry.key, color)
  }
  figure.addEventListener('pointerenter', () => home.look(true))
  figure.addEventListener('pointerleave', () => home.look(false))
  // a dye colours the creature in its place and its double of the sky alike
  const dyeButtons = figure.querySelectorAll<HTMLButtonElement>('.mascots-dye')
  const choose = (k: number) => {
    wear(dyes[k])
    dyeButtons.forEach((x, j) => {
      x.classList.toggle('on', j === k)
      x.setAttribute('aria-pressed', String(j === k))
    })
  }
  dyeButtons.forEach((b, k) => b.addEventListener('click', () => choose(k)))
  // out of its place, into the sky (with how to call it back)
  const setOut = (back: (landed: () => void) => void) => {
    recall = back
    home.show(false)
    remember(entry.key, worn)
    figure.classList.add('free')
    act.textContent = 'rappeler'
    act.setAttribute('aria-label', `rappeler ${entry.name}`)
  }
  // out of its place, into the sky; then back to land in it (a click while it lands is ignored)
  const toggle = (free: boolean) => {
    if (landing || free === !!recall) return
    if (free) {
      setOut(flight.free(i, canvas, home))
      label()
      return
    }
    landing = true
    remember(entry.key, undefined)
    recall!(() => {
      home.show(true)
      landing = false
      figure.classList.remove('free')
      act.textContent = 'libérer'
      act.setAttribute('aria-label', `libérer ${entry.name}`)
    })
    recall = null
    label()
  }
  // the button under its name, or the creature itself
  for (const b of [button, act]) b.addEventListener('click', () => toggle(!recall))
  // out since another page: it flies on (from where it was, or in from a side) until it is called back, in the colour it
  // wore (its own if that dye is gone); the others stay in their places
  const before = freed()
  if (entry.key in before) {
    choose(Math.max(0, dyes.indexOf(before[entry.key])))
    const back = { canvas, home }
    // (given its place, either one tells how to call it back)
    setOut((seen[entry.key] ? flight.resume(i, seen[entry.key], back) : flight.roam(i, back))!)
  } else wear(entry.own)
  out.push(() => !!recall)
  return toggle
})

label()

// all at once: free them all, or, when they are all out, call them all back
all.addEventListener('click', () => {
  const free = !out.every((isOut) => isOut())
  toggles.forEach((toggle, i) => setTimeout(() => toggle(free), i * 90))
})
