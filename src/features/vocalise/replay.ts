import type { Point } from './ribbon'
import { toHz } from './pitch'

// Réécouter le dessin : un son doux (une sinusoïde, et un peu de triangle à l'octave pour la chaleur) suit le ruban
// d'un bout à l'autre, à la même hauteur et au même volume, avec les mêmes silences. Rien d'enregistré : c'est le
// dessin qu'on entend, pas la voix.

let ctx: AudioContext | null = null

// strokes : les rubans, du plus ancien au plus récent ; onEnd : quand c'est fini (ou arrêté)
export function replay(strokes: Point[][], onEnd: () => void) {
  const points = strokes.flat()
  if (points.length < 2) return null
  // (à appeler dans un geste, un clic : sans lui, le navigateur garde le son coupé)
  ctx ??= new AudioContext()
  void ctx.resume()
  const begin = ctx.currentTime + 0.05
  const first = points[0].t
  const end = points[points.length - 1].t - first

  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(ctx.destination)
  const voices = [
    { type: 'sine' as const, octave: 1, loud: 1 },
    { type: 'triangle' as const, octave: 2, loud: 0.15 },
  ].map(({ type, octave, loud }) => {
    const osc = ctx!.createOscillator()
    osc.type = type
    const level = ctx!.createGain()
    level.gain.value = loud
    osc.connect(level).connect(gain)
    return { osc, octave }
  })

  for (const s of strokes) {
    if (!s.length) continue
    const at = (p: Point) => begin + p.t - first
    // chaque ruban : le son s'ouvre, suit la note et le volume, puis se referme
    // (les rampes doivent se suivre dans le temps : le volume s'ouvre en 30 ms, puis suit les points d'après)
    const open = at(s[0]) + 0.03
    gain.gain.setValueAtTime(0, at(s[0]))
    for (const p of s) {
      for (const v of voices) v.osc.frequency.linearRampToValueAtTime(toHz(p.midi) * v.octave, at(p))
      gain.gain.linearRampToValueAtTime(0.06 + p.level * 0.22, Math.max(open, at(p)))
    }
    gain.gain.linearRampToValueAtTime(0, at(s[s.length - 1]) + 0.08)
  }
  for (const v of voices) {
    v.osc.frequency.setValueAtTime(toHz(points[0].midi) * v.octave, ctx.currentTime)
    v.osc.start(begin)
    v.osc.stop(begin + end + 0.2)
  }
  voices[0].osc.onended = onEnd

  const clock = ctx
  return {
    // où en est la lecture, dans l'heure du ruban
    at: () => first + Math.max(0, clock.currentTime - begin),
    stop() {
      for (const v of voices) v.osc.stop()
    },
  }
}
export type Replay = NonNullable<ReturnType<typeof replay>>
