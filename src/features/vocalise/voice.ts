import { rms, toMidi, yin } from './pitch'

// La voix, au micro : à chaque image, la note qu'on chante (en demi-tons), ou rien. Le silence et le bruit de la
// pièce ne comptent pas (un seuil de volume, qui suit le bruit de fond) ; une note isolée qui saute (une consonne,
// une octave de travers) non plus (la médiane des dernières) ; et un petit trou entre deux syllabes ne coupe pas la
// note. Rien n'est enregistré ni envoyé : le son reste dans le navigateur.

// pourquoi le micro ne vient pas : refusé (par la personne ou le navigateur), absent, ou impossible ici (une page
// sans https, un vieux navigateur)
export type Refusal = 'refused' | 'absent' | 'unsupported'
export class MicError extends Error {
  constructor(readonly why: Refusal) {
    super(why)
  }
}

export type Heard = { midi: number; level: number }

// (à appeler dans un geste, un clic : sans lui, iOS garde le son coupé)
export async function listen() {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported')
  // (le contexte d'abord, pendant le geste ; on le reprend après la question du navigateur)
  const ctx = new AudioContext()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // (la voix brute : l'annulation d'écho et la réduction de bruit abîment les notes tenues)
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
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
  // (2048 échantillons : de quoi voir deux périodes d'une voix d'homme très grave, et une image sur deux à peine)
  analyser.fftSize = 2048
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Float32Array(analyser.fftSize)

  // le bruit de fond : il descend vite vers le plus calme qu'on a entendu, remonte lentement (et seulement avec du
  // bruit, pas avec une note)
  let floor = 0.004
  // les dernières notes entendues (pour la médiane), et depuis quand on n'entend plus rien
  const recent: number[] = []
  let last: Heard | null = null
  let quiet = 0

  return {
    // la note chantée en ce moment (dt : le temps depuis l'image d'avant, en secondes)
    read(dt: number): Heard | null {
      analyser.getFloatTimeDomainData(buf)
      const level = rms(buf)
      const loud = level > Math.max(0.01, floor * 3)
      const p = loud ? yin(buf, ctx.sampleRate) : null
      const sung = p !== null && p.clarity > 0.8
      // (une note tenue n'est pas du bruit : le fond n'apprend que des sons sans hauteur)
      if (level < floor) floor += (level - floor) * 0.3
      else if (!sung) floor = Math.min(0.05, floor + (level - floor) * 0.01)
      if (p && sung) {
        quiet = 0
        recent.push(toMidi(p.hz))
        if (recent.length > 5) recent.shift()
        const sorted = [...recent].sort((a, b) => a - b)
        last = { midi: sorted[sorted.length >> 1], level: Math.min(1, (level - floor) / 0.12) }
        return last
      }
      // (un trou bref, entre deux syllabes : on garde la note)
      quiet += dt
      if (quiet < 0.12 && last) return last
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
