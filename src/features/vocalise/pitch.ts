// La hauteur d'un son : l'algorithme YIN (de Cheveigné et Kawahara, 2002). On compare le signal à lui-même, décalé
// d'un peu plus à chaque fois ; le premier décalage où il se ressemble nettement est sa période. Plus juste que
// l'autocorrélation seule : elle se trompe volontiers d'une octave (vers le bas), YIN beaucoup moins.

// (min, max : les hauteurs cherchées, en Hz ; threshold : à quel point le signal doit se ressembler)
export function yin(buf: Float32Array, rate: number, min = 60, max = 1100, threshold = 0.12) {
  const W = buf.length >> 1
  const lo = Math.max(2, Math.floor(rate / max))
  const hi = Math.min(W - 1, Math.ceil(rate / min))
  // la différence entre le signal et lui-même décalé de tau, divisée par sa moyenne jusque-là (elle vaut 1 en
  // moyenne, et tombe près de 0 à la période)
  const d = new Float32Array(hi + 2)
  let sum = 0
  d[0] = 1
  for (let tau = 1; tau <= hi + 1; tau++) {
    let s = 0
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau]
      s += x * x
    }
    sum += s
    d[tau] = sum ? (s * tau) / sum : 1
  }
  // le premier creux sous le seuil (on descend jusqu'au fond du creux) ; sinon, rien de sûr : pas de note
  let tau = lo
  while (tau <= hi && d[tau] >= threshold) tau++
  if (tau > hi) return null
  while (tau < hi && d[tau + 1] < d[tau]) tau++
  // (entre deux échantillons : le fond de la parabole qui passe par le creux et ses voisins)
  const a = d[tau - 1]
  const b = d[tau]
  const c = d[tau + 1]
  const shift = a + c - 2 * b ? (a - c) / (2 * (a + c - 2 * b)) : 0
  return { hz: rate / (tau + shift), clarity: 1 - b }
}

// le volume (la moyenne quadratique du signal)
export function rms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

// Hz ↔ demi-tons (le numéro MIDI : 69, le la à 440 Hz)
export const toMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440)
export const toHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

// le nom d'une note, à la française (do3 : le do du milieu du piano)
const NAMES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'si♭', 'si']
export function noteName(midi: number) {
  const m = Math.round(midi)
  return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 2}`
}
// la couleur d'une note : un tour du cercle chromatique par octave (do rouge, ré jaune, mi vert, sol bleu, la
// violet, si rose), et entre deux notes, la couleur entre les deux
export const hue = (midi: number) => ((((midi % 12) + 12) % 12) / 12) * 360
