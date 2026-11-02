import { art, type Creature } from './art'

// Les créatures 21 à 30 : encore quelques bêtes.
export const C3: Creature[] = [
  {
    n: 21,
    name: 'axolotl',
    note: 'sourit tout le temps, branchies en couronne',
    idle: art`
 }(o o){
  (   )~~
  "  "
`,
    walk: art`
 }(o o){
  (   )~~
  / \
`,
    jump: art`
 }(o o){
  (   )~~~
 /    \
`,
    climb: art`
 |
 }(o o){
  (   )\
  /  |~
`,
    climb2: art`
       |
 }(o o){
 /(   )
  |  \~
`,
    crouch: art`
 }(o o){
  (___)~~
`,
  },
  {
    n: 22,
    name: 'paresseux',
    note: 'lent, mais ne lâche jamais prise',
    idle: art`
 (-.-)
 /( )\
  " "
`,
    walk: art`
 (-.-)
 /( )\
  / "
`,
    jump: art`
\(o.o)/
  ( )
 /   \
`,
    climb: art`
 |
 (-.-)\
  ( )
`,
    climb2: art`
     |
 /(-.-)
  ( )
`,
    crouch: art`
 (-.-)
 (/ \)
`,
  },
  {
    n: 27,
    name: 'ourson',
    note: 'pataud, mais grimpeur',
    idle: art`
 ()_()
 (o.o)
 (   )
  " "
`,
    walk: art`
 ()_()
 (o.o)
 (   )
  / \
`,
    jump: art`
 ()_()
\(o.o)/
 (   )
 /   \
`,
    climb: art`
 |()_()
 (o.o)
 (   )\
 /   |
`,
    climb2: art`
  ()_()|
 (o.o)
/(   )
 |   \
`,
    crouch: art`
 ()_()
 (o.o)
 (___)
`,
  },
  {
    n: 28,
    name: 'panda roux',
    note: 'la queue rayée',
    idle: art`
 /\_/\
(=o.o=)
 /   \~#~#
`,
    walk: art`
 /\_/\
(=o.o=)
 \   /~#~#
`,
    jump: art`
 /\_/\
(=^.^=)
//   \\~#~#
`,
    climb: art`
 |/\_/\
(=o.o=)
 /   |~#
`,
    climb2: art`
  /\_/\|
(=o.o=)
 |   \~#
`,
    crouch: art`
 /\_/\
(=o.o=)
 (___)~#~#
`,
  },
]
