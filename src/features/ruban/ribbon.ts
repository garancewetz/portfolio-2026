import { hue } from './pitch'

// Le ruban : tant qu'on chante, chaque image ajoute un point à sa tête (la note, le volume), à l'endroit où en est le
// défilement (x, en pixels du monde). Ensuite, le point file vers la gauche avec tout le ruban, et reste : il ne
// disparaît qu'en sortant de la page. Un silence coupe le ruban : le prochain son en commence un autre, et entre les
// deux, un trou. Le dessin, sur le noir : d'abord le halo de tous les rubans, puis leur cœur.

export type Point = { x: number; midi: number; level: number }
export type Stroke = Point[]

export function ribbons() {
  const strokes: Stroke[] = []
  let open = false

  return {
    strokes,
    // (rien à dessiner, ni à enregistrer)
    get empty() {
      return !strokes.length
    },
    // le ruban qu'on est en train de chanter (null : en silence)
    get singing() {
      return open ? strokes[strokes.length - 1] : null
    },
    // un son à l'abscisse x (ou rien : le ruban se coupe)
    add(x: number, heard: { midi: number; level: number } | null) {
      if (!heard) return void (open = false)
      if (!open) strokes.push([])
      open = true
      // (la hauteur et le volume un peu lissés : le ruban ondule avec la voix, sans trembler d'un pixel à l'autre)
      const s = strokes[strokes.length - 1]
      const prev = s[s.length - 1]
      const midi = prev ? prev.midi + (heard.midi - prev.midi) * 0.45 : heard.midi
      const level = prev ? prev.level + (heard.level - prev.level) * 0.2 : heard.level
      s.push({ x, midi, level })
    },
    // (on oublie ce qui est sorti de la page, à gauche)
    prune(before: number) {
      for (const s of strokes) while (s.length > 1 && s[1].x < before) s.shift()
      while (strokes.length > 1 && strokes[0][strokes[0].length - 1].x < before) strokes.shift()
    },
    // la note du ruban s à l'abscisse x (entre deux points, celle d'entre les deux), ou null s'il n'y passe pas
    at(s: Stroke, x: number) {
      if (!s.length || x < s[0].x || x > s[s.length - 1].x) return null
      let i = 1
      while (i < s.length - 1 && s[i].x < x) i++
      const a = s[i - 1] ?? s[0]
      const b = s[i] ?? a
      return b.x === a.x ? b.midi : a.midi + ((x - a.x) / (b.x - a.x)) * (b.midi - a.midi)
    },
    // le premier ruban qui commence après x
    after(x: number) {
      return strokes.find((s) => s.length && s[0].x > x) ?? null
    },
    // scroll : où en est le défilement ; headX : où naît le ruban sur la page ; yOf : la hauteur d'une note
    draw(g: CanvasRenderingContext2D, scroll: number, headX: number, yOf: (m: number) => number) {
      g.lineCap = 'round'
      g.lineJoin = 'round'
      const xOf = (p: Point) => headX - (scroll - p.x)
      for (const pass of ['halo', 'core'] as const)
        for (const s of strokes)
          for (let i = 1; i < s.length; i++) {
            const a = s[i - 1]
            const b = s[i]
            // l'épaisseur suit le volume (un fil quand on chante doucement, un trait franc quand on chante fort) ;
            // la couleur, la note ; le halo, juste un peu de lumière autour
            const w = 1.5 + b.level ** 1.5 * 9
            g.strokeStyle = `hsl(${hue(b.midi)} 85% ${pass === 'halo' ? 9 : 52 + b.level * 18}%)`
            g.lineWidth = pass === 'halo' ? w + 7 : w
            g.beginPath()
            g.moveTo(xOf(a), yOf(a.midi))
            g.lineTo(xOf(b), yOf(b.midi))
            g.stroke()
          }
    },
  }
}
export type Ribbons = ReturnType<typeof ribbons>
