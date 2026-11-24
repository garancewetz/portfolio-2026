import { hue } from './pitch'

// The ribbon: while you sing, each frame adds a point at its head (the note, the volume), where the scrolling
// stands (x, in world pixels). Then the point runs to the left with the whole ribbon, and stays: it only
// disappears when it leaves the page. A silence cuts the ribbon: the next sound starts another one, and between
// the two, a gap. The drawing, on the black: first the halo of all the ribbons, then their core.

export type Point = { x: number; midi: number; level: number }
export type Stroke = Point[]

export function ribbons() {
  const strokes: Stroke[] = []
  let open = false

  return {
    strokes,
    // (nothing to draw, nor to save)
    get empty() {
      return !strokes.length
    },
    // the ribbon being sung right now (null: in silence)
    get singing() {
      return open ? strokes[strokes.length - 1] : null
    },
    // a sound at abscissa x (or nothing: the ribbon is cut)
    add(x: number, heard: { midi: number; level: number } | null) {
      if (!heard) return void (open = false)
      if (!open) strokes.push([])
      open = true
      // (the pitch and volume slightly smoothed: the ribbon waves with the voice, without trembling from one pixel to
      // the next)
      const s = strokes[strokes.length - 1]
      const prev = s[s.length - 1]
      const midi = prev ? prev.midi + (heard.midi - prev.midi) * 0.45 : heard.midi
      const level = prev ? prev.level + (heard.level - prev.level) * 0.2 : heard.level
      s.push({ x, midi, level })
    },
    // (forget what has left the page, on the left)
    prune(before: number) {
      for (const s of strokes) while (s.length > 1 && s[1].x < before) s.shift()
      while (strokes.length > 1 && strokes[0][strokes[0].length - 1].x < before) strokes.shift()
    },
    // the note of ribbon s at abscissa x (between two points, the one in between), or null if it does not pass there
    at(s: Stroke, x: number) {
      if (!s.length || x < s[0].x || x > s[s.length - 1].x) return null
      let i = 1
      while (i < s.length - 1 && s[i].x < x) i++
      const a = s[i - 1] ?? s[0]
      const b = s[i] ?? a
      return b.x === a.x ? b.midi : a.midi + ((x - a.x) / (b.x - a.x)) * (b.midi - a.midi)
    },
    // the first ribbon starting after x
    after(x: number) {
      return strokes.find((s) => s.length && s[0].x > x) ?? null
    },
    // scroll: how far the scrolling has gone; headX: where the ribbon is born on the page; yOf: the height of a note
    draw(g: CanvasRenderingContext2D, scroll: number, headX: number, yOf: (m: number) => number) {
      g.lineCap = 'round'
      g.lineJoin = 'round'
      const xOf = (p: Point) => headX - (scroll - p.x)
      for (const pass of ['halo', 'core'] as const)
        for (const s of strokes)
          for (let i = 1; i < s.length; i++) {
            const a = s[i - 1]
            const b = s[i]
            // the thickness follows the volume (a thread when you sing softly, a bold stroke when you sing loud);
            // the colour, the note; the halo, just a little light around it
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
