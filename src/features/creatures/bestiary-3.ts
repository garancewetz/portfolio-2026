import { art, type Creature } from './art'

// Les créatures 21 à 30 : encore quelques bêtes.
export const C3: Creature[] = [
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
]
