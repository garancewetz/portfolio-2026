// The little man, in characters: an o head, a # body (like a studded jacket), arms and legs as strokes.
// Each frame is 3 characters by 4 lines (the same box in every posture, so he does not jump from one frame to
// the next). Drawn facing right; mirror() flips him.

export type Sprite = string[]

// standing, still
export const STAND: Sprite = ['   ', ' o ', '/#\\', '/ \\']
// walking: legs apart, then crossing, arms swinging
export const WALK: Sprite[] = [
  ['   ', ' o ', '/#\\', '/ \\'],
  ['   ', ' o ', ' #\\', ' | '],
  ['   ', ' o ', '/# ', ' |\\'],
  ['   ', ' o ', ' #\\', ' | '],
]
// climbing, against the edge (on the right): hands towards the edge, one up, then the other; one foot pushing
export const CLIMB: Sprite[] = [
  ['  /', ' o ', ' #\\', '/ |'],
  ['   ', ' o/', ' #\\', ' |\\'],
]
// hanging from the top edge: hands gripping, one moves ahead, then the other
export const HANG: Sprite[] = [
  ['\\ /', ' o ', ' # ', '/ \\'],
  [' |/', ' o ', ' # ', ' |\\'],
]
// in the air: going up (a jump), coming down (he falls, arms up)
export const RISE: Sprite = ['  /', ' o ', '/# ', '/ \\']
export const FALL: Sprite = ['\\o/', ' # ', '/ \\', '   ']

// pushed by an edge moving in: he backs off, arms forward
export const PUSHED: Sprite = ['   ', ' o ', '\\#/', '/ \\']
// crushed by a window too low: crouching
export const CROUCH: Sprite = ['   ', '   ', ' o ', '/#\\']
// he sleeps (you switched to another tab): sitting, legs stretched out, and his z's
export const SLEEP: Sprite[] = [
  ['  z', ' o ', '/#\\', ' ‾‾'],
  ['  Z', ' o ', '/#\\', ' ‾‾'],
]
// grabbed by the mouse: holding on with one hand, he dangles
export const CARRIED: Sprite[] = [
  [' | ', ' o ', '/#\\', '/ \\'],
  [' | ', ' o ', '/#\\', ' |\\'],
]

// a wave: facing us, he waves his hand (in front of the door, before going in)
export const WAVE: Sprite[] = [
  ['   ', ' o/', '/# ', '/ \\'],
  ['   ', ' o_', '/# ', '/ \\'],
]

// facing left: each line reversed, the slanted strokes flipped
const flip: Record<string, string> = { '/': '\\', '\\': '/' }
export const mirror = (s: Sprite): Sprite =>
  s.map((line) =>
    [...line]
      .reverse()
      .map((c) => flip[c] ?? c)
      .join(''),
  )
