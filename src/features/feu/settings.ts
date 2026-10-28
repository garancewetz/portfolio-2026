import { gear, slider, swatches } from '@/features/carnet/gear'
import { COLORS } from '@/features/fireworks/show'

// La roue crantée, dans la ligne du carnet (voir carnet/gear.ts) : pour jouer avec le spectacle. La cadence des
// tirs, la taille des gerbes, et leurs couleurs (leurs places dans COLORS, voir fireworks/show.ts : violet, rose,
// bleu, vert, orange, or), en pastilles : chacune montre ses couleurs, en parts égales. Tout change tout de suite,
// dès la fusée suivante.
const PALETTES = {
  toutes: [0, 1, 2, 3, 4, 5],
  or: [5],
  froides: [0, 2, 3],
  chaudes: [1, 4, 5],
} as const
type Palette = keyof typeof PALETTES
const NAMES = Object.keys(PALETTES) as Palette[]
// une pastille : ses couleurs en parts égales, autour du centre (une seule : la couleur pleine)
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
