import { art, type Creature } from './art'

// Les créatures 1 à 10 : des bêtes qui existent (plus ou moins).
export const C1: Creature[] = [
  {
    n: 2,
    name: 'singe',
    note: 'se pend par les mains, ou par la queue',
    idle: art`
 ° °
(o.o)
 /#\@
 / \
`,
    walk: art`
 ° °
(o.o)
 /#\@
  |\
`,
    jump: art`
\° °/
(o.o)
  #  @
 / \
`,
    climb: art`
 |
(o.o)
 (#\@
 |  \
`,
    climb2: art`
   |
(o.o)
 /#)@
 /  |
`,
    crouch: art`
 ° °
(o.o)
/(#)\@
`,
  },
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
