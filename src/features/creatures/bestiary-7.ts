import { art, type Creature } from './art'

// Le yéti sans bras (67), celui de Ruban : il grimpe, et vole en battant des oreilles.
export const C7: Creature[] = [
  {
    n: 67,
    name: 'yéti oreilles sans bras',
    note: 'grimpe en battant des oreilles',
    idle: art`
(\.:::./)
 :(o.o):
 :(   ):
  '' ''
`,
    walk: art`
(\.:::./)
 :(o.o):
 :(   ):
  /' '\
`,
    jump: art`
(\.:::./)
 :(^.^):
 :(   ):
 /     \
`,
    climb: art`
 _.:::./)
 :(o.o):
 :(   ):
  /  |
`,
    climb2: art`
(\.:::._
 :(o.o):
 :(   ):
   |  \
`,
    crouch: art`
 _.:::._
 :(o.o):
 :(___):
`,
    // il vole en battant des oreilles (en haut, puis à plat), ravi, les jambes pendantes, comme dans Ruban
    fly: [
      art`
\\.:::.//
 :(^.^):
 :(   ):
  /   \
`,
      art`
--.:::.--
 :(^.^):
 :(   ):
  /   \
`,
    ],
  },
]
