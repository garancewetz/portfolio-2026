import type { LookName } from './looks'

// The ticket's four steps in Kit's window, and what each looks like when it is done, under way, or still to come;
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

// (Kit's own words: the plan and its implementation are one step, the audit fixes what it finds)
export const ROUTE: Step[] = [
  { title: 'Plan et implémentation', look: 'think', bars: 3, progress: '3 étapes sur 4 · en cours : l’export', go: 'Aller sur la session', back: 'Voir la vidéo' },
  { title: 'Auditer le code', look: 'audit', bars: 2, progress: 'L’audit tourne', go: 'Suivre l’audit', back: 'Voir le rapport', start: 'Auditer et corriger' },
  { title: 'Faire la PR', look: 'plane', bars: 2, progress: 'Commit, push et ouverture sur GitHub', go: 'Suivre la PR', back: 'Voir la PR', start: 'Créer la PR' },
  { title: 'Livrer', look: 'bloom', bars: 4, progress: 'Mergée : on ferme le worktree ?', go: 'Fermer le worktree' },
]
// (the step under way on arrival)
export const UNDER_WAY = 0
