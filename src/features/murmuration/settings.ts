import { gear, slider } from '@/features/carnet/gear'
import { MAX, settings } from './flock'

// La roue crantée, dans la ligne du carnet (voir carnet/gear.ts) : elle ouvre un petit panneau pour jouer avec le
// vol (la vitesse, la durée avant qu'ils se reposent, le nombre d'oiseaux). Les réglages changent tout de suite,
// même en plein vol. redraw : redessiner (le vol figé ou posé ne se redessine pas tout seul)
export function settingsGear(slot: HTMLElement, redraw: () => void) {
  gear(slot, 'Réglages du vol', [
    slider('vitesse', { min: 0.25, max: 3, step: 0.05, value: settings.speed, show: (n) => `×${n.toFixed(2)}` }, (n) => {
      settings.speed = n
      redraw()
    }),
    slider('durée', { min: 5, max: 90, step: 1, value: settings.fly, show: (n) => `${n} s` }, (n) => {
      settings.fly = n
      redraw()
    }),
    slider('oiseaux', { min: 500, max: MAX, step: 100, value: settings.count, show: (n) => `${n}` }, (n) => {
      settings.count = n
      redraw()
    }),
  ])
}
