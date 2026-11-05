import { art, type Creature } from './art'

// Le paresseux.
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
]
