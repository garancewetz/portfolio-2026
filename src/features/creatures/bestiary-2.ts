import { art, type Creature } from './art'

// Les créatures 11 à 20 : encore des bêtes.
export const C2: Creature[] = [
  {
    n: 13,
    name: 'hibou',
    note: 'sautille, plane un peu',
    idle: art`
 ,_,
(O,O)
(   )
 " "
`,
    walk: art`
 ,_,
(O,O)
(   )
 ' "
`,
    jump: art`
 ,_,
(O,O)
/)  (\
 " "
`,
    climb: art`
 ,_,
(O,O)
|( )|
 " "
`,
  },
  {
    n: 14,
    name: 'pingouin',
    note: 'se dandine, glisse sur le ventre',
    idle: art`
  _
 (o>
 /\\
 \_/
  ^^
`,
    walk: art`
  _
 (o>
 /\\
 \_/
  ^ ^
`,
    jump: art`
  _
\(o>/
  \\
 \_/
 ^  ^
`,
    climb: art`
 \_/
 (o>
 |\\|
 \_/
`,
  },
  {
    n: 17,
    name: 'bouquetin',
    note: 'à l’aise sur les pentes impossibles',
    idle: art`
  @@
 (oo)___
  \_    )
   || ||
`,
    walk: art`
  @@
 (oo)___
  \_    )
   /| |\
`,
    jump: art`
  @@
 (oo)___
  \_    )
  //   \\
`,
    climb: art`
  @@
 (oo)
 |   |
 || ||
`,
  },
  {
    n: 18,
    name: 'loutre',
    note: 'joueuse, glisse dans les descentes',
    idle: art`
 (o o)
 (   )~~
  " "
`,
    walk: art`
 (o o)
 (   )~~
  / \
`,
    jump: art`
 (o o)
~(   )~~
 /   \
`,
    climb: art`
\(o o)/
 (   )
  | |~
`,
  },
]
