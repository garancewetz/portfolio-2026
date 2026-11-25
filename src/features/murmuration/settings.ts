import { gear, slider } from '@/features/carnet/gear'
import { MAX, settings } from './flock'

// The cog wheel, in the notebook line (see carnet/gear.ts): it opens a small panel to play with the flight (the
// speed, the time before they land again, the number of birds). The settings change at once, even mid-flight.
// redraw: redraw (a frozen or perched flock does not redraw itself)
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
