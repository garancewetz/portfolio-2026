import { projects } from '@/content/content'

// Le déroulé de la page, en hauteurs de départ (vh) : où chaque élément part dans la page avant de monter et
// de se coller à sa place (position: sticky). Plus c'est bas, plus il arrive tard en faisant défiler.

// Les projets : à l'arrivée, les cartes sont déjà là, posées en V inversé symétrique, comme un vol d'oiseaux :
// celle du milieu en tête, les autres de plus en plus bas vers les bords, les deux ailes pareilles (les cartes
// à la même distance du milieu, à la même hauteur : elles se rangent ensemble). Les plus basses dépassent du bas
// de l'écran : coupées, elles disent qu'il y a une suite, on fait défiler. En faisant défiler, elles se rangent
// en ligne.
const MID = (projects.length - 1) / 2
const V_TOP = 14 // la carte de tête
const V_STEP = 34 // un cran plus bas à chaque pas vers un bord
const STARTS = projects.map((_, i) => V_TOP + Math.abs(i - MID) * V_STEP)
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
