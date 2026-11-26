import type { LookName } from './looks'

// What Pousse says in the scene, one after another (from Kit's reference: each message its outfit, its line, its one
// button, and where the ticket is among Kit's five steps); then all its outfits, below. Visible text in French.

export type Said = { look: LookName; line: string; action: string; step: number }

export const SAID: Said[] = [
  { look: 'ticket', line: 'Plan prêt.', action: 'Voir le plan', step: 1 },
  { look: 'approval', line: 'Claude attend ta réponse.', action: 'Aller sur la session', step: 2 },
  { look: 'camera', line: 'Ta vidéo est prête !', action: 'Voir la vidéo', step: 2 },
  { look: 'checks', line: 'CI rouge sur #42.', action: 'Réparer la CI', step: 4 },
  { look: 'bloom', line: 'Livré ! On ferme ?', action: 'Ouvrir Kit', step: 5 },
]

// every outfit, in two groups: when it speaks (one per message), when it stays quiet
export const SPEAKING: [LookName, string][] = [
  ['ticket', 'Plan prêt.'],
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
  ['offline', 'Kit ne répond plus.'],
]
