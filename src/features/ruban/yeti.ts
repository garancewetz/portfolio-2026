import type { Sprite } from '@/features/escalade/sprites'

// The armless yeti (picked from the Créatures sheet, no. 67): two big ears, a tuft, a furry belly.
// He has no arms: he climbs and holds on with his ears. All frames in the same box (4 lines, all the same
// width: each line is centred on his feet), facing right. His head and body never move from one frame to the
// next: only his ears, his eyes and his legs change.

const W = 11
const yeti = (...lines: string[]): Sprite => lines.map((l) => l.padEnd(W))

// standing, still
export const STAND = yeti(' (\\.:::./)', '  :(o.o):', '  :(   ):', "   '' ''")
// walking: legs apart, then back together
export const WALK: Sprite[] = [STAND, yeti(' (\\.:::./)', '  :(o.o):', '  :(   ):', "  /' '\\")]
// climbing: he flaps his ears (one goes down, then the other); one foot pushes
export const CLIMB: Sprite[] = [
  yeti('  _.:::./)', '  :(o.o):', '  :(   ):', '   /  |'),
  yeti(' (\\.:::._', '  :(o.o):', '  :(   ):', '    |  \\'),
]
// hanging from the thread by his ears: he strains (eyes squinting), legs kicking
export const HANG: Sprite[] = [
  yeti(' (\\.:::./)', '  :(>.<):', '  :(   ):', '   /  \\'),
  yeti(' (\\.:::./)', '  :(>.<):', '  :(   ):', '    ||'),
]
// in the air: going up (a jump, delighted); coming down, he flies: he flaps his ears very fast (up, then
// flat), legs dangling
export const RISE = yeti(' (\\.:::./)', '  :(^.^):', '  :(   ):', '  /     \\')
export const FLY: Sprite[] = [
  yeti(' \\\\.:::.//', '  :(^.^):', '  :(   ):', '   /   \\'),
  yeti(' --.:::.--', '  :(^.^):', '  :(   ):', '   /   \\'),
]
export const FALL = FLY[0]
// sliding: ears flat, feet first; holding back: crouching, ears flat
export const SLIDE = yeti('  _.:::._', '  :(o.o):', '  :(   ):', '    /  /')
export const BRACE = yeti('', '  _.:::._', '  :(o.o):', '  :(___):')
// sleeping: crouching, eyes closed, and his z's
export const SLEEP: Sprite[] = [
  yeti('          z', '  _.:::._', '  :(-.-):', '  :(___):'),
  yeti('          Z', '  _.:::._', '  :(-.-):', '  :(___):'),
]
