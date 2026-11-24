import { art, type Creature } from './art'

// The armless yeti (67), the one from Ruban: it climbs, and flies by flapping its ears.
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
    // it flies by flapping its ears (up, then flat), delighted, legs dangling, like in Ruban
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
