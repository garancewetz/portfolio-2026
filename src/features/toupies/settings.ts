import { choices, gear } from '@/features/carnet/gear'
import { VIEWS, type View } from './stage'

// The cog wheel, in the notebook line (see carnet/gear.ts): the view, from the side or from above (see
// stage.ts); one button per choice, changing at once, even mid-spin; the panel stays open while you play.

export function settingsGear(slot: HTMLElement, look: (v: View) => void) {
  gear(slot, 'Réglages des toupies', [choices('vue', VIEWS, 'côté', look)], { keep: true })
}
