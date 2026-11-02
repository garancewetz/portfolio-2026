import { art, type Creature } from './art'

// Les créatures 11 à 20 : encore des bêtes.
export const C2: Creature[] = [
  {
    name: 'crabe',
    note: 'marche de côté, pince au bord',
    idle: art`
 v  v
(o)(o)
(____)
/ /\ \
`,
    walk: art`
 V  V
(o)(o)
(____)
\ \/ /
`,
    jump: art`
\v  v/
(o)(o)
(____)
/    \
`,
    climb: art`
 v  v
(o)(o)
-(__)-
 /  \
`,
  },
  {
    name: 'caméléon',
    note: 'un œil devant, un œil derrière',
    idle: art`
  ___
 (@  )>~
  /  \@
`,
    walk: art`
  ___
 (@  )>~
  \  /@
`,
    jump: art`
  ___
 (@  )>~~~~
 /    \@
`,
    climb: art`
  ___
 (@  )
 /|  |\
   @
`,
  },
  {
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
 ,_,
(O,O)
|( )|
 " "
`,
  },
  {
    name: 'pingouin',
    note: 'se dandine, glisse sur le ventre',
    idle: art`
  _
 (o>
 /\\
 \_/
  ^^
`,
    walk: art`
  _
 (o>
 /\\
 \_/
  ^ ^
`,
    jump: art`
  _
\(o>/
  \\
 \_/
 ^  ^
`,
    climb: art`
 \_/
 (o>
 |\\|
 \_/
`,
  },
  {
    name: 'lémurien',
    note: 'de grands yeux, des bonds immenses',
    idle: art`
 (O O)
  (#)  @
  / \ @@
`,
    walk: art`
 (O O)
  (#)  @
  |\  @@
`,
    jump: art`
\(O O)/
  (#)  @
 /   \@@
`,
    climb: art`
 \   /
 (O O)
  (#) @
  | |@@
`,
  },
  {
    name: 'kangourou',
    note: 'ne marche pas : il bondit',
    idle: art`
  /)
 (o.)
 /#\
 \_)\__
`,
    walk: art`
  /)
 (o.)
 /#\
 \_)/__
`,
    jump: art`
   /)
  (o.)
  /#\
 /_/  \__
`,
    climb: art`
 \/)
 (o.)
 |#|
 \_)__
`,
  },
  {
    name: 'bouquetin',
    note: 'à l’aise sur les pentes impossibles',
    idle: art`
  @@
 (oo)___
  \_    )
   || ||
`,
    walk: art`
  @@
 (oo)___
  \_    )
   /| |\
`,
    jump: art`
  @@
 (oo)___
  \_    )
  //   \\
`,
    climb: art`
  @@
 (oo)
 |   |
 || ||
`,
  },
  {
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
\(o o)/
 (   )
  | |~
`,
  },
  {
    name: 'hérisson',
    note: 'se roule en boule pour tomber',
    idle: art`
  ,/\/\/\
 (o  ///\
  "  "
`,
    walk: art`
  ,/\/\/\
 (o  ///\
  /  \
`,
    jump: art`
 ,/\/\/\
(o  ///\
/     \
`,
    climb: art`
 /\/\/\
(o ///)
 |  |
`,
  },
  {
    name: 'petit dragon',
    note: 'ses ailes l’aident à se rattraper',
    idle: art`
  ^ ^ /\
 (o o)\/
 (   )~>
  " "
`,
    walk: art`
  ^ ^ /\
 (o o)\/
 (   )~>
  / \
`,
    jump: art`
  ^ ^  /\/\
 (o o)/\/\
 (   )~>
 /   \
`,
    climb: art`
 \^ ^/
 (o o)
 (   )>
 /   \
`,
  },
]
