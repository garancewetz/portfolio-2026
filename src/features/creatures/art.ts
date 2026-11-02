// Une créature, en caractères : son numéro (fixe : il ne change pas quand on en retire une), son nom, un mot sur
// elle, et ses quatre poses (tournée vers la droite) : au repos, en marche, en plein saut, et en train de grimper. Chaque pose s'écrit telle quelle, entre deux accents graves, sur
// plusieurs lignes (la première et la dernière, vides, ne comptent pas) ; les \ restent des \.

export type Pose = string[]
export type Creature = { n: number; name: string; note: string; idle: Pose; walk: Pose; jump: Pose; climb: Pose }

export const art = (s: TemplateStringsArray): Pose => {
  const lines = s.raw[0].split('\n')
  if (!lines[0].trim()) lines.shift()
  if (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines
}
