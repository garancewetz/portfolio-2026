// Le bonhomme, en caractères : une tête o, un corps # (comme une veste à clous), des bras et des jambes en traits.
// Chaque image fait 3 caractères sur 4 lignes (la même boîte dans toutes les postures, pour qu'il ne saute pas d'une
// image à l'autre). Dessiné tourné vers la droite ; mirror() le retourne.

export type Sprite = string[]

// debout, à l'arrêt
export const STAND: Sprite = ['   ', ' o ', '/#\\', '/ \\']
// la marche : les jambes s'écartent, se croisent, les bras balancent
export const WALK: Sprite[] = [
  ['   ', ' o ', '/#\\', '/ \\'],
  ['   ', ' o ', ' #\\', ' | '],
  ['   ', ' o ', '/# ', ' |\\'],
  ['   ', ' o ', ' #\\', ' | '],
]
// l'escalade, contre le bord (à droite) : les mains vers le bord, l'une en haut, puis l'autre ; un pied qui pousse
export const CLIMB: Sprite[] = [
  ['  /', ' o ', ' #\\', '/ |'],
  ['   ', ' o/', ' #\\', ' |\\'],
]
// suspendu au bord du haut : les mains accrochées, l'une avance, puis l'autre
export const HANG: Sprite[] = [
  ['\\ /', ' o ', ' # ', '/ \\'],
  [' |/', ' o ', ' # ', ' |\\'],
]
// en l'air : en montant (un saut), en descendant (il tombe, les bras en l'air)
export const RISE: Sprite = ['  /', ' o ', '/# ', '/ \\']
export const FALL: Sprite = ['\\o/', ' # ', '/ \\', '   ']

// poussé par un bord qui avance : il recule, les bras en avant
export const PUSHED: Sprite = ['   ', ' o ', '\\#/', '/ \\']
// écrasé par une fenêtre trop basse : accroupi
export const CROUCH: Sprite = ['   ', '   ', ' o ', '/#\\']
// il dort (on est parti sur un autre onglet) : assis, les jambes allongées, et ses z
export const SLEEP: Sprite[] = [
  ['  z', ' o ', '/#\\', ' ‾‾'],
  ['  Z', ' o ', '/#\\', ' ‾‾'],
]
// attrapé par la souris : accroché d'une main, il pend
export const CARRIED: Sprite[] = [
  [' | ', ' o ', '/#\\', '/ \\'],
  [' | ', ' o ', '/#\\', ' |\\'],
]

// coucou : face à nous, il agite la main (devant la porte, avant d'entrer)
export const WAVE: Sprite[] = [
  ['   ', ' o/', '/# ', '/ \\'],
  ['   ', ' o_', '/# ', '/ \\'],
]

// tourné vers la gauche : chaque ligne à l'envers, les traits obliques retournés
const flip: Record<string, string> = { '/': '\\', '\\': '/' }
export const mirror = (s: Sprite): Sprite =>
  s.map((line) =>
    [...line]
      .reverse()
      .map((c) => flip[c] ?? c)
      .join(''),
  )
