import { gear, slider, swatches } from '@/features/carnet/gear'
import { COLORS } from '@/features/fireworks/show'

// The cog wheel, in the notebook line (see carnet/gear.ts): to play with the show. The firing pace, the size of
// the bursts, and their colours (their places in COLORS, see fireworks/show.ts: purple, pink, blue, green,
// orange, gold), as dots: each shows its colours, in equal parts. Everything changes right away, from the
// next rocket.
const PALETTES = {
  toutes: [0, 1, 2, 3, 4, 5],
  or: [5],
  froides: [0, 2, 3],
  chaudes: [1, 4, 5],
} as const
type Palette = keyof typeof PALETTES
const NAMES = Object.keys(PALETTES) as Palette[]
// a dot: its colours in equal parts, around the centre (only one: the solid colour)
const pastille = (p: readonly number[]) =>
  p.length === 1
    ? COLORS[p[0]]
    : `conic-gradient(${p.map((c, i) => `${COLORS[c]} ${(i / p.length) * 360}deg ${((i + 1) / p.length) * 360}deg`).join(', ')})`

export const settings = { pace: 1, size: 1, palette: 'toutes' as Palette }
export const palette = () => PALETTES[settings.palette]

export function settingsGear(slot: HTMLElement) {
  gear(slot, 'Réglages du feu d’artifice', [
    slider('cadence', { min: 0.3, max: 3, step: 0.1, value: settings.pace, show: (n) => `×${n.toFixed(1)}` }, (n) => {
      settings.pace = n
    }),
    slider('taille', { min: 0.5, max: 2, step: 0.1, value: settings.size, show: (n) => `×${n.toFixed(1)}` }, (n) => {
      settings.size = n
    }),
    swatches(
      'couleurs',
      NAMES.map((name) => ({ name, css: pastille(PALETTES[name]) })),
      NAMES.indexOf(settings.palette),
      (k) => {
        settings.palette = NAMES[k]
      },
    ),
  ])
}
