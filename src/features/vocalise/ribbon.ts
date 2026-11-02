import { hue } from './pitch'

// Le ruban : tant qu'on chante, chaque image ajoute un point à sa tête (la note, le volume, l'heure). Ensuite, le
// point file vers la gauche, à vitesse constante, et s'éteint peu à peu ; au bout de `life` secondes, il a disparu.
// Un silence coupe le ruban : le prochain son en commence un autre. Le dessin, sur le noir : d'abord le halo de
// tous les rubans, puis leur cœur, plus fin et plus vif (les couleurs s'assombrissent vers le noir pour s'éteindre,
// sans transparence : les morceaux qui se chevauchent ne font pas de perles).

type Point = { t: number; midi: number; level: number }

export function ribbons() {
  const strokes: Point[][] = []
  let open = false

  return {
    // (rien à dessiner, ni à enregistrer)
    get empty() {
      return !strokes.length
    },
    // un son (ou rien : le ruban se coupe)
    add(t: number, heard: { midi: number; level: number } | null) {
      if (!heard) return void (open = false)
      if (!open) strokes.push([])
      open = true
      // (la hauteur et le volume un peu lissés : le ruban ondule avec la voix, sans trembler d'un pixel à l'autre)
      const s = strokes[strokes.length - 1]
      const prev = s[s.length - 1]
      const midi = prev ? prev.midi + (heard.midi - prev.midi) * 0.45 : heard.midi
      const level = prev ? prev.level + (heard.level - prev.level) * 0.2 : heard.level
      s.push({ t, midi, level })
    },
    // (on oublie ce qui s'est éteint)
    prune(t: number, life: number) {
      for (const s of strokes) while (s.length && t - s[0].t > life) s.shift()
      while (strokes.length && !strokes[0].length) strokes.shift()
    },
    // headX : où naît le ruban ; speed : de combien il file vers la gauche, en pixels par seconde ; yOf : la hauteur
    // d'une note sur la page
    draw(g: CanvasRenderingContext2D, t: number, life: number, headX: number, speed: number, yOf: (m: number) => number) {
      g.lineCap = 'round'
      g.lineJoin = 'round'
      for (const pass of ['halo', 'core'] as const)
        for (const s of strokes)
          for (let i = 1; i < s.length; i++) {
            const a = s[i - 1]
            const b = s[i]
            const fade = Math.max(0, 1 - (t - b.t) / life) ** 1.4
            // l'épaisseur suit le volume (un fil quand on chante doucement, un trait franc quand on chante fort) ;
            // la couleur, la note ; le halo, juste un peu de lumière autour
            const w = 1.5 + b.level ** 1.5 * 9
            const light = pass === 'halo' ? 9 * fade : (52 + b.level * 18) * fade
            g.strokeStyle = `hsl(${hue(b.midi)} 85% ${light}%)`
            g.lineWidth = pass === 'halo' ? w + 7 : w
            g.beginPath()
            g.moveTo(headX - (t - a.t) * speed, yOf(a.midi))
            g.lineTo(headX - (t - b.t) * speed, yOf(b.midi))
            g.stroke()
          }
    },
  }
}
