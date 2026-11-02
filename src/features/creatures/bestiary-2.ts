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
