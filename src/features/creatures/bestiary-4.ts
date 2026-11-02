import { art, type Creature } from './art'

// Les créatures 31 à 40 : des créatures inventées.
export const C4: Creature[] = [
  {
    n: 36,
    name: 'yéti',
    note: 'une petite montagne de poils',
    idle: art`
 .:::.
:(o.o):
:(   ):
 '' ''
`,
    walk: art`
 .:::.
:(o.o):
:(   ):
 /' '\
`,
    jump: art`
 .:::.
:(^.^):
:(   ):
/     \
`,
    climb: art`
\.:::./
:(o.o):
:(   ):
 | | |
`,
    crouch: art`
 .:::.
:(o.o):
:(___):
`,
  },
  {
    n: 37,
    name: 'robot',
    note: 'une antenne, des ressorts',
    idle: art`
  _|_
 [o_o]
 /[_]\
  | |
`,
    walk: art`
  _|_
 [o_o]
 /[_]\
  / |
`,
    jump: art`
  _|_
\[o_o]/
  [_]
 /   \
`,
    climb: art`
 \_|_/
 [o_o]
  [_]
  | |
`,
    crouch: art`
  _|_
 [o_o]
 [_ _]
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
 \   /
>(o.o)<
  |#|
`,
    crouch: art`
>(o.o)<
 (/#\)
`,
  },
  {
    n: 40,
    name: 'cyclope',
    note: 'un grand œil, de longs bras',
    idle: art`
  .-.
 ( O )
 /\ /\
`,
    walk: art`
  .-.
 ( O )
  /\ |\
`,
    jump: art`
  .-.
\( O )/
  / \
`,
    climb: art`
 \.-./
 ( O )
  | |
`,
    crouch: art`
  .-.
 ( O )
 (/ \)
`,
  },
]
