import { art, type Creature } from './art'

// Les créatures 41 à 45 : à la manière de Miyazaki, des bêtes croisées avec des esprits et des légendes.
export const C5: Creature[] = [
  {
    n: 41,
    name: 'kodama-lièvre',
    note: 'esprit des arbres, la tête cliquette',
    idle: art`
 ()()
( o o)
 (  )
  ''
`,
    walk: art`
 ()()
( o o)
 (  )
  /'
`,
    jump: art`
 ()()
( o o)
\(  )/
  ''
`,
    climb: art`
|()()
( o o)
 (  )\
  ''
`,
    climb2: art`
 ()()|
( o o)
/(  )
  ''
`,
    crouch: art`
 ()()
( - -)
 (__)
`,
  },
]
