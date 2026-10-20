import { projects } from '@/content/content'

// Le déroulé de la page, en hauteurs de départ (vh) : où chaque élément part dans la page avant de monter et
// de se coller à sa place (position: sticky). Plus c'est bas, plus il arrive tard en faisant défiler.

// Les projets : à l'arrivée, les cartes sont déjà là, posées selon un motif (SHAPE) : on voit tout de suite
// l'ensemble, et en faisant défiler elles se rangent en ligne. La plus basse dépasse du bas de l'écran : coupée,
// elle dit qu'il y a une suite, on fait défiler.
// - 'v' : en V inversé, comme un vol d'oiseaux : celle du milieu en tête, une aile un peu plus longue que
//   l'autre (moins figé, et les cartes n'arrivent pas deux par deux : chaque coup de molette en range une) ;
// - 'wave' : en vague, une ondulation sur toute la largeur (une crête à gauche, un creux à droite) ;
// - 'diagonal' : en escalier, de haut à gauche vers bas à droite (le sens de lecture : elles se rangent dans
//   l'ordre des projets) ;
// - 'arc' : un V aux bords arrondis, comme la trajectoire d'un objet lancé (le milieu en tête, presque à plat,
//   puis de plus en plus bas vers les bords).
const SHAPE = 'v' as 'v' | 'wave' | 'diagonal' | 'arc'
const N = projects.length
const MID = (N - 1) / 2
const V_TOP = 14 // la carte de tête
const V_LEFT = 27 // un cran plus bas à chaque pas vers la gauche…
const V_RIGHT = 40 // … et vers la droite (l'aile longue)
const WAVE_MID = 48 // le niveau moyen de la vague…
const WAVE_AMP = 34 // … et sa hauteur, de part et d'autre
const DIAG_STEP = 17 // la diagonale : un cran plus bas à chaque carte
const ARC_DROP = 68 // l'arc : de combien les cartes des bords sont plus bas que celle du milieu
const STARTS = Array.from({ length: N }, (_, i) =>
  SHAPE === 'v'
    ? V_TOP + Math.abs(i - MID) * (i < MID ? V_LEFT : V_RIGHT)
    : SHAPE === 'wave'
      ? Math.round(WAVE_MID - WAVE_AMP * Math.sin((2 * Math.PI * (i + 0.5)) / N))
      : SHAPE === 'diagonal'
        ? V_TOP + i * DIAG_STEP
        : Math.round(V_TOP + ARC_DROP * ((i - MID) / MID) ** 2),
)
export const cardStart = (i: number): number => STARTS[i]
const LAST = Math.max(...STARTS) // (la dernière carte à se ranger)
// la colonne de la carte la plus haute (de 1 à N) : vide en bas, « scroll ↓ » s'y pose
export const hintCol = STARTS.indexOf(Math.min(...STARTS)) + 1

// Puis la signature : le nom, en très grand, sous la rangée de cartes. « Garance » NAME_GAP vh après la
// dernière carte, puis « Wetzel » NAME_STEP vh plus loin.
export const NAME: string[] = ['Garance', 'Wetzel']
const NAME_GAP = 60
const NAME_STEP = 40
export const nameStart = (line: number): number => LAST + NAME_GAP + line * NAME_STEP

// La hauteur du champ (cartes et signature) : assez pour que le dernier mot se range, puis une pause courte
// avant la fin de page (plus longue, on ferait défiler un écran entier où rien ne bouge)
export const fieldHeight = `calc(${nameStart(NAME.length - 1) + 20}vh + 2 * var(--lh))`
