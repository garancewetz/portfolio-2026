import { projects } from '@/content/content'

// Le déroulé de la page, en hauteurs de départ (vh) : où chaque élément part dans la page avant de monter et
// de se coller à sa place (position: sticky). Plus c'est bas, plus il arrive tard en faisant défiler.

// Les projets : à l'arrivée, les cartes sont déjà là, posées en V inversé symétrique, comme un vol d'oiseaux :
// celle du milieu en tête, les autres de plus en plus bas vers les bords, les deux ailes pareilles (les cartes
// à la même distance du milieu, à la même hauteur : elles se rangent ensemble). Les plus basses dépassent du bas
// de l'écran : coupées, elles disent qu'il y a une suite, on fait défiler. En faisant défiler, elles se rangent
// en ligne.
// La grille a toujours cinq colonnes : les cinq premiers projets sur la première ligne ; les suivants dessous, sur
// une seconde ligne, centrés sous elle (ils arrivent après que la première ligne s'est rangée).
export const COLS = 5
export const ROWS = Math.ceil(projects.length / COLS)
const NEXT = projects.length - COLS // (combien sur la seconde ligne)
export const cardPlace = (i: number) => ({
  col: i < COLS ? i + 1 : Math.floor((COLS - NEXT) / 2) + 1 + (i - COLS),
  row: Math.floor(i / COLS),
})
const MID = (COLS - 1) / 2
const V_TOP = 14 // la carte de tête
const V_STEP = 34 // un cran plus bas à chaque pas vers un bord
const FIRST_ROW = projects.slice(0, COLS).map((_, i) => V_TOP + Math.abs(i - MID) * V_STEP)
const NEXT_ROWS_GAP = 70 // la seconde ligne : nettement après la dernière carte de la première, une fois rangée
const STARTS = projects.map((_, i) =>
  i < COLS ? FIRST_ROW[i] : Math.max(...FIRST_ROW) + NEXT_ROWS_GAP + (i - COLS) * 20,
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
