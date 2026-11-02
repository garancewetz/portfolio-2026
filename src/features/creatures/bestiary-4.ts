import { art, type Creature } from './art'

// Les créatures 31 à 40 : des créatures inventées.
export const C4: Creature[] = [
  {
    n: 33,
    name: 'mille-pattes',
    note: 'ondule, ne tombe jamais',
    idle: art`
 (o)OOOOO
  ///////
`,
    walk: art`
 (o)OOOOO
  \\\\\\\
`,
    jump: art`
  (o)OOOOO
 // / / //
`,
    climb: art`
 (o)
 -O-
 -O-
 -O-
`,
  },
  {
    n: 35,
    name: 'lutin',
    note: 'un bonnet pointu, très agile',
    idle: art`
   /\
  /__\
 (o o)
  /|\
  / \
`,
    walk: art`
   /\
  /__\
 (o o)
  /|\
  |\
`,
    jump: art`
   /\
  /__\
\(o o)/
   |
  / \
`,
    climb: art`
   /\
 \/__\/
 (o o)
  |||
  / \
`,
  },
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
  },
  {
    n: 39,
    name: 'bestiole à antennes',
    note: 'venue d’ailleurs',
    idle: art`
 \   /
  (oo)
 /(  )\
  "  "
`,
    walk: art`
 \   /
  (oo)
 /(  )\
  / \
`,
    jump: art`
 \   /
  (OO)
 /(  )\
 /    \
`,
    climb: art`
 \   /
 \(oo)/
  (  )
  |  |
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
  },
]
