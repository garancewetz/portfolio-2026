import { art, type Creature } from './art'

// La souris et le gobelin : revenus sur la page.
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
  {
    n: 38,
    name: 'gobelin',
    note: 'de grandes oreilles, un grand sourire',
    idle: art`
>(o.o)<
  /#\
  / \
`,
    walk: art`
>(o.o)<
  /#\
  |\
`,
    jump: art`
>(^.^)<
 \/#\/
  / \
`,
    climb: art`
 |
>(o.o)<
  /#|
  / |
`,
    climb2: art`
      |
>(o.o)<
  |#\
  | \
`,
    crouch: art`
>(o.o)<
 (/#\)
`,
  },
]
