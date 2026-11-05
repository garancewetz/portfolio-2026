// Une créature, en caractères : son numéro (fixe : il ne change pas quand on en retire une), son nom, un mot sur
// elle, et ses poses (tournée vers la droite) : au repos, en marche, en plein saut, en train de grimper (deux images :
// une main en haut, puis l'autre), et accroupie. Chaque pose s'écrit telle quelle, entre deux accents graves, sur
// plusieurs lignes (la première et la dernière, vides, ne comptent pas) ; les \ restent des \.

export type Pose = string[]
// (fly : pour celles qui volent, les images de leur vol, qui s'enchaînent vite)
export type Creature = { n: number; name: string; note: string; idle: Pose; walk: Pose; jump: Pose; climb: Pose; climb2: Pose; crouch: Pose; fly?: Pose[] }

export const art = (s: TemplateStringsArray): Pose => {
  const lines = s.raw[0].split('\n')
  if (!lines[0].trim()) lines.shift()
  if (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines
}
