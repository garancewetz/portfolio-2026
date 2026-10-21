// Les anagrammes du nom : les mêmes lettres, dans un autre ordre (la première, le nom lui-même). Un mot par ligne,
// comme la signature : la 1re ligne en Inter Tight, la 2e en italique.
export const ANAGRAMS: string[][] = [
  ['Garance', 'Wetzel'],
  ['Carnage', 'Wetzel'],
  ['Ancrage', 'Wetzel'],
  ['Éclatez', 'Wagner'],
]

// le voyage des lettres (voir Signature.tsx) : le trajet d'une lettre, l'écart entre deux lettres, et le moment où
// la dernière arrive (le feu d'artifice attend ce moment pour son grand final)
export const MIX_DUR = 1100 // ms
export const MIX_STAGGER = 70 // ms
export const MIX_LANDS = MIX_DUR + MIX_STAGGER * (ANAGRAMS[0].join('').length - 1)

/** une lettre affichée : id = d'où elle vient dans le nom (« ligne-place »), ch = comment elle s'écrit ici */
export interface Letter {
  id: string
  ch: string
}

// (sans accent ni majuscule : le G de Garance donne le g de Carnage, le e de Wetzel le É d'Éclatez)
const plain = (ch: string) => ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// Pour chaque lettre de l'anagramme, celle du nom qui vient s'y mettre : de préférence une lettre de la même
// ligne (elle a moins de chemin à faire), sinon une de l'autre ligne.
export function arrange(lines: string[]): Letter[][] {
  const source = ANAGRAMS[0].flatMap((word, line) =>
    [...word].map((ch, k) => ({ id: `${line}-${k}`, line, ch: plain(ch) })),
  )
  const used = new Set<string>()
  return lines.map((word, line) =>
    [...word].map((ch) => {
      const want = plain(ch)
      const free = source.filter((s) => s.ch === want && !used.has(s.id))
      const pick = free.find((s) => s.line === line) ?? free[0]
      if (!pick) throw new Error(`« ${lines.join(' ')} » n'est pas une anagramme du nom`)
      used.add(pick.id)
      return { id: pick.id, ch }
    }),
  )
}
