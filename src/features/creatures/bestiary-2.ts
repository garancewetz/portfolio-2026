import { art, type Creature } from './art'

// Le hibou et la loutre.
export const C2: Creature[] = [
  {
    n: 13,
    name: 'hibou',
    note: 'sautille, et vole',
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
 |,_,
(O,O)
 ( )\
 " "
`,
    climb2: art`
  ,_,|
(O,O)
/( )
 " "
`,
    crouch: art`
 ,_,
(O,O)
(___)
`,
    // il vole : les ailes en haut, puis à plat, les pattes pendantes (sa tête ne bouge pas)
    fly: [
      art`
 ,_,
(O,O)
\( )/
 " "
`,
      art`
 ,_,
(O,O)
-( )-
 " "
`,
    ],
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
 |
 (o o)
 (   )
  / |~
`,
    climb2: art`
     |
 (o o)
 (   )
  | \~
`,
    crouch: art`
 (o o)
 (___)~~
`,
  },
]
