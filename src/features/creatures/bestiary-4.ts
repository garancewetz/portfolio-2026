import { art, type Creature } from './art'

// Le robot : une créature inventée.
export const C4: Creature[] = [
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
 |_|_
 [o_o]
  [_]\
  / |
`,
    climb2: art`
  _|_|
 [o_o]
 /[_]
  | \
`,
    crouch: art`
  _|_
 [o_o]
 [_ _]
`,
  },
]
