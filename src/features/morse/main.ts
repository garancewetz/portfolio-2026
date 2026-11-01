import './morse.css'
import { mount } from '@/features/carnet/carnet'
import { choices, gear, slider } from '@/features/carnet/gear'
import { spell, timeline, written, type Sign } from './code'
import { createPlayer } from './player'

// Morse : on tape son prénom, ou une phrase, et elle s'écrit en morse à mesure, lettre à lettre : sous chaque
// lettre tapée, ses points et ses traits. Les accents reviennent à leur lettre (é : E) ; ce que le morse ne sait
// pas dire est signalé, sans rien casser. Le bouton la fait entendre (un bip) et clignoter (la lampe, et les marques
// qui s'allument une à une). La roue crantée règle la vitesse, la note du bip, et le son.

const main = document.querySelector<HTMLElement>('.mo')!
const field = main.querySelector<HTMLInputElement>('.mo-field')!
const out = main.querySelector<HTMLElement>('.mo-out')!
const unknown = main.querySelector<HTMLElement>('.mo-unknown')!
const button = main.querySelector<HTMLButtonElement>('.mo-play')!
const lamp = main.querySelector<HTMLElement>('.mo-lamp')!
const text = main.querySelector<HTMLElement>('.mo-text')!
const copy = main.querySelector<HTMLButtonElement>('.mo-copy')!

// (la vitesse en mots par minute : le mot « PARIS », 50 unités, dit tant de fois par minute)
const settings = { wpm: 15, hz: 600, sound: true }

const el = (tag: string, className: string, content = '') => {
  const e = document.createElement(tag)
  e.className = className
  e.textContent = content
  return e
}

// ——— la phrase, dessinée ———

let words: Sign[][] = []
// les signes dessinés (dans l'ordre de la phrase, tous mots confondus), et leurs marques
let signs: HTMLElement[] = []

function drawSign({ shown, letters, codes }: Sign) {
  const box = el('span', 'mo-sign')
  const marks = el('span', 'mo-marks')
  if (codes)
    for (const [c, code] of codes.entries()) {
      if (c) marks.append(el('span', 'mo-gap'))
      for (const s of code) marks.append(el('i', s === '.' ? 'mo-dot' : 'mo-dash'))
    }
  else {
    box.classList.add('is-unknown')
    marks.append(el('span', 'mo-what', '?'))
  }
  box.append(marks, el('span', 'mo-letter', shown))
  // (au survol : la lettre, celle du morse si ce n'est pas la même — é → E —, et son code)
  const said = letters !== shown.toUpperCase() && codes ? ` → ${letters}` : ''
  box.title = codes ? `${shown}${said} : ${written([[{ shown, letters, codes }]])}` : `${shown} : pas de morse`
  return box
}

function render() {
  player.stop()
  playing(false)
  // (rien de tapé : un SOS, à peine visible, pour montrer à quoi ça ressemble)
  const ghost = !field.value.trim()
  words = spell(ghost ? 'sos' : field.value)
  out.classList.toggle('is-ghost', ghost)
  signs = []
  out.replaceChildren(
    ...words.map((word) => {
      const w = el('span', 'mo-word')
      for (const sign of word) w.append(signs[signs.push(drawSign(sign)) - 1])
      return w
    }),
  )
  const missing = [
    ...new Set(
      words
        .flat()
        .filter((s) => !s.codes)
        .map((s) => s.shown),
    ),
  ]
  unknown.textContent = missing.length
    ? `pas de morse pour ${missing.map((c) => `« ${c} »`).join(', ')} : ${missing.length > 1 ? 'laissés' : 'laissé'} de côté`
    : ''
  const line = written(words)
  text.textContent = ghost ? '' : line
  copy.hidden = ghost || !line
  button.disabled = !timeline(words).marks.length
}

// ——— la lecture ———

let lit: HTMLElement | null = null
let reading: HTMLElement | null = null
const light = (mark: HTMLElement | null, sign: HTMLElement | null) => {
  if (mark !== lit) {
    lit?.classList.remove('is-lit')
    mark?.classList.add('is-lit')
    lit = mark
    lamp.classList.toggle('is-lit', !!mark)
  }
  if (sign !== reading) {
    reading?.classList.remove('is-reading')
    sign?.classList.add('is-reading')
    reading = sign
  }
}

const player = createPlayer(
  ({ mark, sign }) => {
    const box = signs[sign] ?? null
    const m = mark && signs[mark.sign]?.querySelectorAll<HTMLElement>('.mo-dot, .mo-dash')[mark.mark]
    light(m || null, box)
  },
  () => playing(false),
)

function playing(on: boolean) {
  if (!on) light(null, null)
  main.classList.toggle('is-playing', on)
  button.textContent = on ? '■ arrêter' : settings.sound ? '▶ écouter' : '▶ voir clignoter'
  button.setAttribute('aria-pressed', String(on))
}

function toggle() {
  if (player.playing()) {
    player.stop()
    playing(false)
    return
  }
  const { marks, units } = timeline(words)
  if (!marks.length) return
  player.play(marks, units, { unit: 1.2 / settings.wpm, hz: settings.hz, sound: settings.sound })
  playing(true)
}

field.addEventListener('input', render)
// (Entrée, dans le champ : écouter)
field.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
})
button.addEventListener('click', toggle)
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && player.playing()) {
    player.stop()
    playing(false)
  }
})
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(text.textContent ?? '')
    copy.textContent = 'copié'
  } catch {
    copy.textContent = 'pas copié'
  }
  setTimeout(() => (copy.textContent = 'copier'), 1600)
})

render()
field.focus({ preventScroll: true })

// la roue crantée (dans la ligne du carnet) : la vitesse, la note du bip, le son
const slot = mount()
if (slot)
  gear(slot, 'Réglages du morse', [
    slider('mots / min', { min: 5, max: 30, step: 1, value: settings.wpm, show: String }, (n) => {
      settings.wpm = n
    }),
    slider('note', { min: 400, max: 900, step: 10, value: settings.hz, show: (n) => `${n} Hz` }, (n) => {
      settings.hz = n
    }),
    choices('son', ['avec le son', 'sans le son'] as const, 'avec le son', (v) => {
      settings.sound = v === 'avec le son'
      if (!player.playing()) playing(false)
    }),
  ])
