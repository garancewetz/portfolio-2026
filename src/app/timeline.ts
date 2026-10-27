import { projects } from '@/content/content'

// Le déroulé de la page, en hauteurs de départ (vh) : où chaque élément part dans la page avant de monter et
// de se coller à sa place (position: sticky). Plus c'est bas, plus il arrive tard en faisant défiler.

// Les projets : à l'arrivée, les cartes sont déjà là, posées en V inversé symétrique, comme un vol d'oiseaux :
// celle du milieu en tête, les autres de plus en plus bas vers les bords, les deux ailes pareilles (les cartes
// à la même distance du milieu, à la même hauteur : elles se rangent ensemble). Les plus basses dépassent du bas
// de l'écran : coupées, elles disent qu'il y a une suite, on fait défiler. En faisant défiler, elles se rangent
// en ligne.
// La grille a cinq colonnes, une par projet, tout sur une ligne (au-delà, une seconde ligne, en partant de la
// première colonne). Les cartes d'une seconde ligne arriveraient après que la première s'est rangée.
export const COLS = 5
const PLACES = projects.map((_, k) => ({ col: (k % COLS) + 1, row: Math.floor(k / COLS) }))
export const cardPlace = (i: number) => PLACES[i]
export const ROWS = Math.max(...PLACES.map((p) => p.row)) + 1
const MID = (COLS - 1) / 2
const V_TOP = 14 // la carte de tête
const V_STEP = 34 // un cran plus bas à chaque pas vers un bord
// (la première ligne : en V, selon la colonne)
const V = (col: number) => V_TOP + Math.abs(col - 1 - MID) * V_STEP
const FIRST_ROW = Array.from({ length: COLS }, (_, c) => V(c + 1))
const NEXT_ROWS_GAP = 70 // la seconde ligne : nettement après la dernière carte de la première, une fois rangée
let later = 0
const STARTS = PLACES.map(({ col, row }) =>
  row === 0 ? V(col) : Math.max(...FIRST_ROW) + NEXT_ROWS_GAP + later++ * 20,
)
export const cardStart = (i: number): number => STARTS[i]
const LAST = Math.max(...STARTS) // (la dernière carte à se ranger)
// la colonne de la carte la plus haute (de 1 à N) : vide en bas, « scroll ↓ » s'y pose
export const hintCol = FIRST_ROW.indexOf(Math.min(...FIRST_ROW)) + 1

// Puis la signature : le nom, sur une ligne, posé en bas de l'écran. « Garance » NAME_GAP vh après la dernière
// carte, puis « Wetzel » NAME_STEP vh plus loin (il arrive juste après, et se pose à côté).
export const NAME: string[] = ['Garance', 'Wetzel']
const NAME_GAP = 60
const NAME_STEP = 25
export const nameStart = (line: number): number => LAST + NAME_GAP + line * NAME_STEP

// La hauteur du champ (cartes et signature) : assez pour que le dernier mot se range, puis une pause courte
// avant la fin de page (plus longue, on ferait défiler un écran entier où rien ne bouge)
export const fieldHeight = `calc(${nameStart(NAME.length - 1) + 20}vh + var(--lh))`
