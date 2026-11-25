// Où est Yaya ? The hiding places (see scene.ts), in the order she is searched for: her feet (x, y), her size (as
// a share of the screen height), what partly hides her (one of the foliage pieces, or the village houses) —
// without anything, she is in front of everything —, and sometimes the house she is entirely behind. The pieces
// of the collage move aside a little under the mouse (see push.ts): you find her by searching. The last one is
// not a hiding place: she appears large, in front.

export type Rect = { x: number; y: number; w: number; h: number }
export type Layout = { m1: Rect; m2: Rect; m3: Rect; village: Rect[]; leaves: Rect[] }
export type Spot = { x: number; y: number; tall: number; under?: number | 'village'; behind?: number }

// the church (the house with the bell tower, the fifth)
const CHURCH = 4
// Yaya, cut out (see scene.ts): the height of her shoes in the image, as a share of her height
export const FEET = 0.88
// hidden behind an edge (in y), with only her top peeking out (part: the share of her height visible)
const peek = (edge: number, H: number, tall: number, part: number) => edge + H * tall * (FEET - part)

export const SPOTS: ((W: number, H: number, L: Layout) => Spot)[] = [
  // 1. behind the middle bush: her head peeks out (pushing the bush, her shoulders)
  (_W, H, L) => ({ x: L.leaves[2].x + L.leaves[2].w * 0.62, y: peek(L.leaves[2].y, H, 0.17, 0.2), tall: 0.17, under: 2 }),
  // 2. standing at the very top of the bell tower (in the photo, the tower is two thirds across, its top slightly
  // below the upper edge)
  (_W, _H, L) => ({ x: L.village[CHURCH].x + L.village[CHURCH].w * 0.69, y: L.village[CHURCH].y + L.village[CHURCH].h * 0.05, tall: 0.06 }),
  // 3. entirely behind the big bush on the right, near its left edge
  (W, H, L) => ({ x: L.leaves[4].x + W * 0.026, y: H * 0.98, tall: 0.3, under: 4 }),
  // 4. tiny, on the hill at the edge of the last mountain layer, on the left
  (W, _H, L) => ({ x: W * 0.12, y: L.m3.y + 1, tall: 0.035 }),
  // 5. behind the church, right by its right edge (pushing it to the left, you see her)
  (_W, _H, L) => ({ x: L.village[CHURCH].x + L.village[CHURCH].w * 0.84, y: L.village[CHURCH].y + L.village[CHURCH].h * 0.36, tall: 0.06, under: 'village', behind: CHURCH }),
  // 6. behind the fourth bush, at its far left
  (_W, H, L) => ({ x: L.leaves[3].x + L.leaves[3].w * 0.12, y: peek(L.leaves[3].y, H, 0.13, 0.32), tall: 0.13, under: 3 }),
  // 7. minuscule, on the top of the mountain at the back, against the sky (in the photo, the summit is three fifths
  // across, just below the upper edge; the photo is laid out by width, its height follows: 198 / 1772)
  (_W, _H, L) => ({ x: L.m1.x + L.m1.w * 0.62, y: L.m1.y + L.m1.w * (198 / 1772) * 0.13, tall: 0.026 }),
  // 8. entirely behind the big bush on the left, near its right edge
  (W, H, L) => ({ x: L.leaves[0].x + L.leaves[0].w - W * 0.026, y: H * 0.98, tall: 0.27, under: 0 }),
  // 9. behind the lowest of the village houses: her head peeks above the roofs
  (_W, H, L) => ({ x: L.village[0].x + L.village[0].w * 0.55, y: peek(L.village[0].y, H, 0.07, 0.02), tall: 0.07, under: 'village' }),
  // 10. behind the big bush on the right, just the top of her head
  (_W, H, L) => ({ x: L.leaves[4].x + L.leaves[4].w * 0.4, y: peek(L.leaves[4].y, H, 0.1, 0.22), tall: 0.1, under: 4 }),
  // and at the end: in the foreground, bottom right, large, as in a photo where someone pokes their head in
  (W, H) => ({ x: W * 0.84, y: H * 1.45, tall: 0.95 }),
]
// the last place: the end of the game (and the number of times she must be found before it)
export const LAST = SPOTS.length - 1
