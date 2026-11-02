import { hue } from './pitch'
import type { Heard } from './voice'

// Le ruban : tant qu'on chante, chaque image ajoute un point à sa tête (la note, le volume, la voyelle, l'heure).
// Ensuite, le point file vers la gauche, à vitesse constante, et s'éteint peu à peu ; au bout de `life` secondes, il
// a disparu. Un silence coupe le ruban : le prochain son en commence un autre. Le dessin, sur le noir : d'abord le
// halo de tous les rubans, puis leur cœur, puis leurs étincelles (les couleurs s'assombrissent vers le noir pour
// s'éteindre, sans transparence : les morceaux qui se chevauchent ne font pas de perles). La voyelle fait la
// texture : « ou », un fil doux dans un halo large ; « i », un fil net qui scintille.

export type Point = Heard & { t: number }

// (un nombre entre 0 et 1, toujours le même pour un même point : ses étincelles ne sautent pas d'une image à l'autre)
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function ribbons() {
  const strokes: Point[][] = []
  let open = false

  return {
    strokes,
    // un son (ou rien : le ruban se coupe)
    add(t: number, heard: Heard | null) {
      if (!heard) return void (open = false)
      if (!open) strokes.push([])
      open = true
      // (un peu lissés : le ruban ondule avec la voix, sans trembler d'un pixel à l'autre)
      const s = strokes[strokes.length - 1]
      const prev = s[s.length - 1]
      const ease = (k: 'midi' | 'level' | 'bright', by: number) => (prev ? prev[k] + (heard[k] - prev[k]) * by : heard[k])
      s.push({ t, midi: ease('midi', 0.45), level: ease('level', 0.2), bright: ease('bright', 0.15) })
    },
    // (on oublie ce qui s'est éteint)
    prune(t: number, life: number) {
      for (const s of strokes) while (s.length && t - s[0].t > life) s.shift()
      while (strokes.length && !strokes[0].length) strokes.shift()
    },
    // t : l'heure du ruban (arrêtée quand il est figé) ; now : l'heure vraie (les étincelles scintillent toujours) ;
    // headX : où naît le ruban ; speed : de combien il file vers la gauche, en pixels par seconde ; yOf : la hauteur
    // d'une note ; played : jusqu'où on l'a réécouté (ce qui est déjà rejoué s'éclaire), ou null
    draw(
      g: CanvasRenderingContext2D,
      t: number,
      now: number,
      life: number,
      headX: number,
      speed: number,
      yOf: (m: number) => number,
      played: number | null,
    ) {
      g.lineCap = 'round'
      g.lineJoin = 'round'
      const xOf = (p: Point) => headX - (t - p.t) * speed
      const fadeOf = (p: Point) => Math.max(0, 1 - (t - p.t) / life) ** 1.4
      // l'épaisseur suit le volume (un fil quand on chante doucement, un trait franc quand on chante fort)
      const width = (p: Point) => 1.5 + p.level ** 1.5 * 9
      for (const pass of ['halo', 'core'] as const)
        for (const s of strokes)
          for (let i = 1; i < s.length; i++) {
            const a = s[i - 1]
            const b = s[i]
            const fade = fadeOf(b)
            const lit = played !== null && b.t <= played ? 18 : 0
            const soft = 1 - b.bright
            const w = width(b)
            const light =
              pass === 'halo' ? (6 + soft * 10 + lit / 3) * fade : Math.min(92, 52 + b.level * 18 + lit) * fade
            g.strokeStyle = `hsl(${hue(b.midi)} 85% ${light}%)`
            g.lineWidth = pass === 'halo' ? w + 5 + soft * 9 : w
            g.beginPath()
            g.moveTo(xOf(a), yOf(a.midi))
            g.lineTo(xOf(b), yOf(b.midi))
            g.stroke()
          }
      // les étincelles : autour des points aux voyelles claires, quelques grains de lumière qui scintillent
      for (const s of strokes)
        for (let i = 0; i < s.length; i += 2) {
          const p = s[i]
          const k = (p.bright - 0.4) / 0.6
          if (k <= 0) continue
          const seed = p.t * 1000
          const twinkle = 0.5 + 0.5 * Math.sin(now * 9 + seed)
          const light = (55 + 35 * twinkle) * k * fadeOf(p)
          if (light < 4) continue
          g.fillStyle = `hsl(${hue(p.midi)} 70% ${light}%)`
          const spread = width(p) / 2 + 3 + 9 * k
          g.fillRect(xOf(p) + (hash(seed) - 0.5) * 6, yOf(p.midi) + (hash(seed + 0.5) - 0.5) * 2 * spread, 1.5, 1.5)
        }
    },
  }
}
