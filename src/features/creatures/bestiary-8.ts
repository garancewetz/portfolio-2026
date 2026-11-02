import { art, type Creature } from './art'

// Les créatures 56 à 61 : encore des variantes du yéti (36) : d'autres oreilles.
export const C8: Creature[] = [
  {
    n: 56,
    name: 'yéti oreilles pointues',
    note: 'pointues sur les côtés, comme un elfe',
    idle: art`
 .:::.
<(o.o)>
:(   ):
 '' ''
`,
    walk: art`
 .:::.
<(o.o)>
:(   ):
 /' '\
`,
    jump: art`
 .:::.
<(^.^)>
:(   ):
/     \
`,
    climb: art`
|.:::.
<(o.o)>
:(   ):
 /  |
`,
    climb2: art`
 .:::.|
<(o.o)>
:(   ):
  |  \
`,
    crouch: art`
 .:::.
-(o.o)-
:(___):
`,
  },
  {
    n: 58,
    name: 'yéti oreilles rondes',
    note: 'un ourson des neiges',
    idle: art`
().:.()
:(o.o):
:(   ):
 '' ''
`,
    walk: art`
().:.()
:(o.o):
:(   ):
 /' '\
`,
    jump: art`
().:.()
:(^.^):
:(   ):
/     \
`,
    climb: art`
|().:.()
 :(o.o):
 :(   ):
  /  |
`,
    climb2: art`
().:.()|
:(o.o):
:(   ):
  |  \
`,
    crouch: art`
().:.()
:(o.o):
:(___):
`,
  },
]
