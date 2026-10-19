// Le déroulé de la page, en hauteurs de départ (vh) : où chaque élément part dans la page avant de monter et
// de se coller à sa place (position: sticky). Plus c'est bas, plus il arrive tard en faisant défiler.

// Les projets : à l'arrivée, les 5 cartes sont déjà là, posées à des hauteurs différentes, sans ordre apparent
// (la plus basse dépasse du bas de l'écran) : on voit tout de suite l'ensemble, et chaque coup de molette en
// range une, de la plus haute à la plus basse. (Des hauteurs fixes, choisies : la page est la même à chaque
// visite.)
const STARTS = [26, 62, 14, 80, 44]
export const cardStart = (i: number): number => STARTS[i % STARTS.length]
const LAST = Math.max(...STARTS) // (la dernière carte à se ranger)

// Puis la signature : le nom, en très grand, sous la rangée de cartes. « Garance » NAME_GAP vh après la
// dernière carte, puis « Wetzel » NAME_STEP vh plus loin.
export const NAME: string[] = ['Garance', 'Wetzel']
const NAME_GAP = 60
const NAME_STEP = 40
export const nameStart = (line: number): number => LAST + NAME_GAP + line * NAME_STEP

// La hauteur du champ (cartes et signature) : assez pour que le dernier mot se range, puis une pause courte
// avant la fin de page (plus longue, on ferait défiler un écran entier où rien ne bouge)
export const fieldHeight = `calc(${nameStart(NAME.length - 1) + 20}vh + 2 * var(--lh))`
