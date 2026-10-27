import { choices, gear } from '@/features/carnet/gear'
import { GROUNDS, type Ground } from './ground'
import { VIEWS, type View } from './stage'

// La roue crantée, dans la ligne du carnet (voir carnet/gear.ts) : de quoi jouer avec ce qu'on voit des toupies. Un
// bouton par choix ; chacun change tout de suite, même en pleine course ; le panneau reste ouvert pendant qu'on joue.
// - vue : de côté ou de dessus (voir stage.ts) ;
// - sol : papier ou miroir (voir ground.ts).

type Hooks = {
  view: (v: View) => void
  ground: (g: Ground) => void
}

export function settingsGear(slot: HTMLElement, hooks: Hooks) {
  gear(
    slot,
    'Réglages des toupies',
    [
      choices('vue', VIEWS, 'côté', hooks.view),
      choices('sol', GROUNDS, 'papier', hooks.ground),
    ],
    { keep: true },
  )
}
