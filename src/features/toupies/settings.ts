import { choices, gear } from '@/features/carnet/gear'
import { VIEWS, type View } from './stage'

// La roue crantée, dans la ligne du carnet (voir carnet/gear.ts) : la vue, de côté ou de dessus (voir stage.ts) ; un
// bouton par choix, qui change tout de suite, même en pleine course ; le panneau reste ouvert pendant qu'on joue.

export function settingsGear(slot: HTMLElement, look: (v: View) => void) {
  gear(slot, 'Réglages des toupies', [choices('vue', VIEWS, 'côté', look)], { keep: true })
}
