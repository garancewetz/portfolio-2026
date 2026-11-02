import { art, type Creature } from './art'

// Les créatures 51 à 55, et 67 : des variantes du yéti (36).
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
  },
]
