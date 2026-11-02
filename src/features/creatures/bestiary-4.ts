import { art, type Creature } from './art'

// Les créatures 31 à 40 : des créatures inventées.
export const C4: Creature[] = [
  {
    name: 'petit raptor',
    note: 'court vite, saute loin',
    idle: art`
  __
 (o >
  \ \___
  /_/ \~~
`,
    walk: art`
  __
 (o >
  \ \___
  \_\ /~~
`,
    jump: art`
  __
 (o >
  \ \___
 //   \\~~
`,
    climb: art`
  __
 (o >
 /| |\
  | |~~
`,
  },
  {
    name: 'poulpe',
    note: 'huit bras pour s’accrocher',
    idle: art`
  ___
 (o o)
 /||||\
`,
    walk: art`
  ___
 (o o)
 \||||/
`,
    jump: art`
  ___
 (o o)
//||||\\
`,
    climb: art`
 \___/
 (o o)
  ||||
`,
  },
  {
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
    name: 'diablotin',
    note: 'des cornes, une queue en flèche',
    idle: art`
 }   {
(o v o)
 /|_|\
  / \ ~>
`,
    walk: art`
 }   {
(o v o)
 /|_|\
  |\ ~>
`,
    jump: art`
  }   {
\(o v o)/
   |_|
  /   \ ~>
`,
    climb: art`
 \}  {/
(o v o)
  |_|
 /   \~>
`,
  },
  {
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
