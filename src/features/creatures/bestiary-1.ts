import { art, type Creature } from './art'

// Les créatures 1 à 10 : des bêtes qui existent (plus ou moins).
export const C1: Creature[] = [
  {
    name: 'gecko',
    note: 'colle aux pentes, file au ras du fil',
    idle: art`
 .  .
~=(__)o>
 '  '
`,
    walk: art`
 '  .
~=(__)o>
 .  '
`,
    jump: art`
   .    .
~~=(____)o>
`,
    climb: art`
 \o/
 -#-
 /#\
  ~
`,
  },
  {
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
    name: 'écureuil',
    note: 'la grande queue fait balancier',
    idle: art`
  _  @@
 (o)@@@
 /|\ @
`,
    walk: art`
  _  @@
 (o)@@@
 / \ @
`,
    jump: art`
 \_/ @@
 (o)@@@
 /   \
`,
    climb: art`
 \o/@
  # @@
 / \@
`,
  },
  {
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
  {
    name: 'araignée',
    note: 'huit pattes, et son propre fil',
    idle: art`
 /\(oo)/\
/\ (  ) /\
`,
    walk: art`
 \/(oo)\/
/\ (  ) /\
`,
    jump: art`
\  (oo)  /
 \/(  )\/
`,
    climb: art`
   |
 /(oo)\
//(  )\\
`,
  },
  {
    name: 'fourmi',
    note: 'porte dix fois son poids',
    idle: art`
  \ /
  (o)o00
  /|\|\
`,
    walk: art`
  \ /
  (o)o00
  |/|/|
`,
    jump: art`
  \ /
  (o)o00
 // \\\
`,
    climb: art`
 \(o)/
 -(0)-
 -(0)-
`,
  },
]
