// The pitch of a sound: the YIN algorithm (de Cheveigné and Kawahara, 2002). The signal is compared with itself,
// shifted a little more each time; the first shift where it clearly resembles itself is its period. More accurate
// than autocorrelation alone: that one easily gets an octave wrong (downwards), YIN much less so.

// (min, max: the pitches searched for, in Hz; threshold: how much the signal must resemble itself)
export function yin(buf: Float32Array, rate: number, min = 60, max = 1100, threshold = 0.12) {
  const W = buf.length >> 1
  const lo = Math.max(2, Math.floor(rate / max))
  const hi = Math.min(W - 1, Math.ceil(rate / min))
  // the difference between the signal and itself shifted by tau, divided by its mean so far (it is 1 on average,
  // and drops near 0 at the period)
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
  // the first dip below the threshold (go down to the bottom of the dip); otherwise, nothing certain: no note
  let tau = lo
  while (tau <= hi && d[tau] >= threshold) tau++
  if (tau > hi) return null
  while (tau < hi && d[tau + 1] < d[tau]) tau++
  // (between two samples: the bottom of the parabola through the dip and its neighbours)
  const a = d[tau - 1]
  const b = d[tau]
  const c = d[tau + 1]
  const shift = a + c - 2 * b ? (a - c) / (2 * (a + c - 2 * b)) : 0
  return { hz: rate / (tau + shift), clarity: 1 - b }
}

// the volume (the root mean square of the signal)
export function rms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

// Hz ↔ semitones (the MIDI number: 69, the A at 440 Hz)
export const toMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440)
export const toHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

// the name of a note, the French way (do3: the middle C of the piano)
const NAMES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'si♭', 'si']
export function noteName(midi: number) {
  const m = Math.round(midi)
  return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 2}`
}
// the colour of a note: one turn of the colour wheel per octave (C red, D yellow, E green, G blue, A purple,
// B pink), and between two notes, the colour in between
export const hue = (midi: number) => ((((midi % 12) + 12) % 12) / 12) * 360
