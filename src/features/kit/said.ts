import type { LookName } from './looks'

// What Pousse says in the scene, one after another (from Kit's reference: each message its outfit, its line, its one
// button, and where the ticket is among Kit's four steps); then all its outfits, below. Visible text in French.

export type Said = { look: LookName; line: string; action: string; step: number }

export const SAID: Said[] = [
  { look: 'ticket', line: 'Plan challengé.', action: 'Voir le plan', step: 1 },
  { look: 'approval', line: 'Claude attend ta réponse.', action: 'Aller', step: 1 },
  { look: 'camera', line: 'Ta vidéo est prête !', action: 'Voir la vidéo', step: 1 },
  { look: 'checks', line: 'CI rouge sur #42.', action: 'Remettre au vert', step: 4 },
  { look: 'bloom', line: 'Livré ! On ferme ?', action: 'Fermer le worktree', step: 4 },
]

// one ticket's way through the four steps, said by Pousse at each stop (the walk above Kit's window)
export const WALK: { look: LookName; step: string; line: string }[] = [
  { look: 'ticket', step: '01 · le plan', line: 'Plan challengé.' },
  { look: 'camera', step: '01 · la preuve', line: 'Ta vidéo est prête !' },
  { look: 'audit', step: '02 · l’audit', line: 'Audit terminé.' },
  { look: 'plane', step: '03 · la PR', line: 'PR prête.' },
  { look: 'bloom', step: '04 · livrer', line: 'Livré ! On ferme ?' },
]

// every outfit, in two groups: when it speaks (one per message), when it stays quiet
export const SPEAKING: [LookName, string][] = [
  ['ticket', 'Plan challengé.'],
  ['done', 'Claude a fini, à toi.'],
  ['approval', 'Claude attend ta réponse.'],
  ['camera', 'Ta vidéo est prête !'],
  ['audit', 'Audit terminé.'],
  ['plane', 'PR prête.'],
  ['bloom', 'Livré ! On ferme ?'],
  ['checks', 'CI rouge.'],
  ['feedback', 'Un retour sur ta PR.'],
  ['review', 'On attend ta review.'],
  ['heavy', 'Session lourde.'],
]
export const QUIET: [LookName, string][] = [
  ['mint', 'Rien ne t’attend.'],
  ['think', 'Claude travaille.'],
  ['asleep', 'Ne pas déranger.'],
  ['addressed', 'Retours traités.'],
]
