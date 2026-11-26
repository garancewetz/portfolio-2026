import type { Look } from './looks-shared'
import { approval, asleep, checksRed, heavySession, offline, prFeedback, rest, reviewAsked, turnDone } from './looks-moods'
import { auditDone, planReady, prReady, shipped, think, videoReady } from './looks-ticket'

// Pousse's outfits, one per message, and how each moves (ported from Kit's VS Code extension). One Pousse, one size:
// only the outfit, the pose and the face change, and two messages never share one.

export type { Look }

export const LOOKS = {
  mint: rest,
  think,
  done: turnDone,
  asleep,
  offline,
  ticket: planReady,
  camera: videoReady,
  audit: auditDone,
  plane: prReady,
  bloom: shipped,
  approval,
  checks: checksRed,
  heavy: heavySession,
  review: reviewAsked,
  feedback: prFeedback,
} satisfies Record<string, () => Look>

export type LookName = keyof typeof LOOKS
