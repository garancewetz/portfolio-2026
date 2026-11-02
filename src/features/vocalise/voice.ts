import { rms, toMidi, yin } from './pitch'

// La voix, au micro : à chaque image, la note qu'on chante (en demi-tons, sans l'arrondir : un glissando glisse), son
// volume, et sa couleur de voyelle ; ou rien. La voyelle : « ou » garde son énergie dans le grave, « i » en a beaucoup
// dans l'aigu (vers 2 à 3 kHz), « a » entre les deux ; on compare l'aigu au grave, et on le ramène entre 0 et 1 sur
// ce que cette voix-là a déjà fait (le plus sombre et le plus clair entendus). Le silence et le bruit de la pièce ne comptent pas (un seuil, qui suit le bruit de fond) ;
// une note isolée qui saute (une consonne, une octave de travers) non plus (la médiane des dernières) ; et un petit
// trou entre deux syllabes ne coupe pas la note. Rien n'est enregistré ni envoyé : le son reste dans le navigateur.

// pourquoi le micro ne vient pas : refusé (par la personne ou le navigateur), absent, ou impossible ici (une page
// sans https, un vieux navigateur)
export type Refusal = 'refused' | 'absent' | 'unsupported'
export class MicError extends Error {
  constructor(readonly why: Refusal) {
    super(why)
  }
}

// (midi : la note ; level : le volume, de 0 à 1 ; bright : la voyelle, de 0 (« ou ») à 1 (« i »))
export type Heard = { midi: number; level: number; bright: number }

// (à appeler dans un geste, un clic : sans lui, iOS garde le son coupé)
export async function listen() {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported')
  // (le contexte d'abord, pendant le geste ; on le reprend après la question du navigateur)
  const ctx = new AudioContext()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // (la réduction de bruit efface le ventilateur, le gain automatique remonte un micro faible)
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
  } catch (e) {
    ctx.close()
    const name = (e as DOMException).name
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError')
      throw new MicError('absent')
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('refused')
    throw new MicError('unsupported')
  }
  await ctx.resume()
  const analyser = ctx.createAnalyser()
  // (2048 échantillons : de quoi voir deux périodes d'une voix très grave)
  analyser.fftSize = 2048
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Float32Array(analyser.fftSize)
  const spectrum = new Float32Array(analyser.frequencyBinCount)
  const bin = (hz: number) => Math.round((hz / ctx.sampleRate) * analyser.fftSize)
  // l'énergie entre deux fréquences (le spectre est en décibels)
  const energy = (a: number, b: number) => {
    let e = 0
    for (let i = bin(a); i <= bin(b); i++) e += 10 ** (spectrum[i] / 10)
    return e
  }
  // la voyelle : l'aigu contre le grave (en décibels), et ce qu'on a déjà entendu de plus sombre et de plus clair
  // (au départ, une plage raisonnable, qui s'élargit avec la voix)
  let dark = -22
  let clear = -6
  let bright = 0.5

  // le bruit de fond : il descend vite vers le plus calme qu'on a entendu, remonte lentement (seulement sous le seuil)
  let floor = 0.001
  const recent: number[] = []
  let last: Heard | null = null
  let quiet = 0

  return {
    // sensitivity : de 0,5 (il faut chanter fort) à 2,5 (un murmure suffit) ; dt : le temps depuis l'image d'avant
    read(dt: number, sensitivity: number): Heard | null {
      analyser.getFloatTimeDomainData(buf)
      const level = rms(buf)
      const start = Math.max(0.004, floor * 2.5) / sensitivity
      if (level < floor) floor += (level - floor) * 0.3
      else if (level < start) floor = Math.min(0.02, floor + (level - floor) * 0.02)
      const p = level > start ? yin(buf, ctx.sampleRate) : null
      if (p && p.clarity > 0.75) {
        quiet = 0
        analyser.getFloatFrequencyData(spectrum)
        const ratio = 10 * Math.log10(energy(1600, 3600) / (energy(200, 1100) || 1e-12) || 1e-12)
        dark = Math.min(dark, ratio)
        clear = Math.max(clear, ratio)
        bright += (Math.max(0, Math.min(1, (ratio - dark) / (clear - dark))) - bright) * 0.25
        recent.push(toMidi(p.hz))
        if (recent.length > 5) recent.shift()
        const sorted = [...recent].sort((a, b) => a - b)
        last = { midi: sorted[sorted.length >> 1], level: Math.min(1, (level - start) / (start * 25)), bright }
        return last
      }
      // (un trou bref, entre deux syllabes : on garde la note)
      quiet += dt
      if (quiet < 0.1 && last) return last
      recent.length = 0
      last = null
      return null
    },
    stop() {
      for (const t of stream.getTracks()) t.stop()
      ctx.close()
    },
  }
}
export type Voice = Awaited<ReturnType<typeof listen>>
