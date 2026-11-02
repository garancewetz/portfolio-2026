import { art, type Creature } from './art'

// Les créatures 1 à 10 : des bêtes qui existent (plus ou moins).
export const C1: Creature[] = [
  {
    n: 8,
    name: 'souris',
    note: 'minuscule, toujours pressée',
    idle: art`
 ()()
(o.o)~
 " "
`,
    walk: art`
 ()()
(o.o)~
 / \
`,
    jump: art`
 ()()
(^.^)~
/   \
`,
    climb: art`
 |()()
 (o.o)
  / |~
`,
    climb2: art`
  ()()|
 (o.o)
  | \~
`,
    crouch: art`
 ()()
(o.o)~
`,
  },
]
