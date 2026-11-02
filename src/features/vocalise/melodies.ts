// Les notes qui flottent sur le chemin de la lueur ne sont pas tirées au hasard : ce sont des chansons. Chacune
// une suite de [degré, durée] (le degré en demi-tons au-dessus de la tonique, la durée en temps). On ne dit pas
// laquelle : on la découvre en chantant, son nom n'apparaît qu'à la fin.

export type Melody = { name: string; notes: [number, number][] }

// (do 0, ré 2, mi 4, fa 5, sol 7, la 9 ; sol grave -5)
export const MELODIES: Melody[] = [
  {
    name: 'Au clair de la lune',
    notes: [[0, 1], [0, 1], [0, 1], [2, 1], [4, 2], [2, 2], [0, 1], [4, 1], [2, 1], [2, 1], [0, 3]],
  },
  {
    name: 'Frère Jacques',
    notes: [
      [0, 1], [2, 1], [4, 1], [0, 1], [0, 1], [2, 1], [4, 1], [0, 1],
      [4, 1], [5, 1], [7, 2], [4, 1], [5, 1], [7, 2],
      [7, 0.5], [9, 0.5], [7, 0.5], [5, 0.5], [4, 1], [0, 1], [0, 1], [-5, 1], [0, 2],
    ],
  },
  {
    name: 'Ah ! vous dirai-je, maman',
    notes: [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]],
  },
  {
    name: 'la gamme',
    notes: [[0, 1], [2, 1], [4, 1], [5, 1], [7, 1], [9, 1], [11, 1], [12, 2], [11, 1], [9, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 2]],
  },
]
