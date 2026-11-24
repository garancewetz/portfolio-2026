// A creature, in characters: its number (fixed: it does not change when one is removed), its name, a word about
// it, and its poses (facing right): at rest, walking, mid-jump, climbing (two frames: one hand up, then the
// other), and crouching. Each pose is written as is, between two backticks, over several lines (the first and
// last, empty, do not count); the \ stay \.

export type Pose = string[]
// (fly: for those that fly, the frames of their flight, which follow each other quickly)
export type Creature = { n: number; name: string; note: string; idle: Pose; walk: Pose; jump: Pose; climb: Pose; climb2: Pose; crouch: Pose; fly?: Pose[] }

export const art = (s: TemplateStringsArray): Pose => {
  const lines = s.raw[0].split('\n')
  if (!lines[0].trim()) lines.shift()
  if (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines
}
