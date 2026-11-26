import type { LookName } from './looks'

// The ticket's five steps in Kit's window, and what each looks like when it is done, under way, or still to come;
// with the outfit the small Pousse beside the title wears while that step is under way. Visible text in French.

export type Step = {
  title: string
  look: LookName
  // under way: how far (out of four), what is happening, the one button
  bars: number
  progress: string
  go: string
  // done: the button to look back; to come: the button to start it (none: nothing to press yet)
  back?: string
  start?: string
}

export const ROUTE: Step[] = [
  { title: 'Plan', look: 'ticket', bars: 1, progress: 'Claude écrit le plan', go: 'Aller sur la session', back: 'Revoir le plan' },
  { title: 'Implémentation et preuve vidéo', look: 'think', bars: 3, progress: '3 étapes sur 4 · en cours : l’export', go: 'Aller sur la session', back: 'Voir la vidéo', start: 'Commencer' },
  { title: 'Audit', look: 'audit', bars: 2, progress: 'Ses agents relisent le code', go: 'Aller sur la session', back: 'Lire l’audit', start: 'Lancer l’audit' },
  { title: 'PR', look: 'plane', bars: 2, progress: 'CI en cours · un retour', go: 'Aller sur la PR', back: 'Voir la PR', start: 'Créer la PR' },
  { title: 'Livrer', look: 'bloom', bars: 4, progress: 'Mergée : on ferme le worktree ?', go: 'Fermer le worktree' },
]
// (the step under way on arrival)
export const UNDER_WAY = 1
