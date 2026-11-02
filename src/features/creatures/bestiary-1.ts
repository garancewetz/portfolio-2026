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
 \ /
(o.o)
 /#\@
 | |
`,
  },
  {
    n: 3,
    name: 'grenouille',
    note: 'sautille, bondit très loin, ventouses',
    idle: art`
 @..@
(----)
(>__<)
`,
    walk: art`
 @..@
(----)
 /  \
`,
    jump: art`
  @..@
 (----)
//    \\
`,
    climb: art`
 o  o
(\__/)
 |  |
`,
  },
  {
    n: 4,
    name: 'renard',
    note: 'rusé, la queue en panache',
    idle: art`
 /\_/\
 (o.o)~~~
  " "
`,
    walk: art`
 /\_/\
 (o.o)~~~
  / \
`,
    jump: art`
 /\_/\
 (o.o)~~~
 /    \
`,
    climb: art`
 /\_/\
 (o.o)
 /| |\
  ~~
`,
  },
  {
    n: 5,
    name: 'chat',
    note: 'retombe toujours sur ses pattes',
    idle: art`
 /\_/\
( o.o )
 > ^ <
`,
    walk: art`
 /\_/\
( o.o )~
 /   \
`,
    jump: art`
 /\_/\
( ^.^ )~
//   \\
`,
    climb: art`
 \/ \/
( o.o )
 |   |~
`,
  },
  {
    n: 6,
    name: 'lapin',
    note: 'tout en bonds',
    idle: art`
 (\(\
 (o.o)
 o(")(")
`,
    walk: art`
 (\(\
 (o.o)
  /  \
`,
    jump: art`
  (\(\
  (o.o)
 /    \
`,
    climb: art`
 (\(\
 (o.o)
 /| |\
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
\()()/
 (o.o)
  | |~
`,
  },
]
