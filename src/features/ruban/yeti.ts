import type { Sprite } from '@/features/escalade/sprites'

// Le yéti sans bras (choisi sur la planche Créatures, n° 67) : deux grandes oreilles, une touffe, un ventre de poils.
// Il n'a pas de bras : il grimpe et il s'accroche avec ses oreilles. Toutes les images dans la même boîte (4 lignes,
// toutes de la même largeur : chaque ligne est centrée sur ses pieds), tourné vers la droite. Sa tête et son corps ne
// bougent jamais d'une image à l'autre : seuls ses oreilles, ses yeux et ses jambes changent.

const W = 11
const yeti = (...lines: string[]): Sprite => lines.map((l) => l.padEnd(W))

// debout, à l'arrêt
export const STAND = yeti(' (\\.:::./)', '  :(o.o):', '  :(   ):', "   '' ''")
// la marche : les jambes s'écartent, puis se rejoignent
export const WALK: Sprite[] = [STAND, yeti(' (\\.:::./)', '  :(o.o):', '  :(   ):', "  /' '\\")]
// la grimpe : il bat des oreilles (l'une se baisse, puis l'autre) ; un pied pousse
export const CLIMB: Sprite[] = [
  yeti('  _.:::./)', '  :(o.o):', '  :(   ):', '   /  |'),
  yeti(' (\\.:::._', '  :(o.o):', '  :(   ):', '    |  \\'),
]
// pendu au fil par les oreilles : il force (les yeux plissés), les jambes qui battent
export const HANG: Sprite[] = [
  yeti(' (\\.:::./)', '  :(>.<):', '  :(   ):', '   /  \\'),
  yeti(' (\\.:::./)', '  :(>.<):', '  :(   ):', '    ||'),
]
// en l'air : en montant (un saut, ravi) ; en descendant, il vole : il bat très vite des oreilles (en haut, puis à
// plat), les jambes pendantes
export const RISE = yeti(' (\\.:::./)', '  :(^.^):', '  :(   ):', '  /     \\')
export const FLY: Sprite[] = [
  yeti(' \\\\.:::.//', '  :(^.^):', '  :(   ):', '   /   \\'),
  yeti(' --.:::.--', '  :(^.^):', '  :(   ):', '   /   \\'),
]
export const FALL = FLY[0]
// glisser : les oreilles couchées, les pieds devant ; se retenir : accroupi, les oreilles couchées
export const SLIDE = yeti('  _.:::._', '  :(o.o):', '  :(   ):', '    /  /')
export const BRACE = yeti('', '  _.:::._', '  :(o.o):', '  :(___):')
// dormir : accroupi, les yeux fermés, et ses z
export const SLEEP: Sprite[] = [
  yeti('          z', '  _.:::._', '  :(-.-):', '  :(___):'),
  yeti('          Z', '  _.:::._', '  :(-.-):', '  :(___):'),
]
