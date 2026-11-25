import { rms, toMidi, yin } from './pitch'

// The voice, through the mic: on each frame, the note being sung (in semitones, unrounded: a glissando glides),
// and its volume; or nothing. Silence and room noise do not count (a threshold, which follows the background
// noise); nor does an isolated note that jumps (a consonant, an octave off) (the median of the latest ones); and
// a small gap between two syllables does not cut the note. Nothing is recorded or sent: the sound stays in the
// browser.

// why the mic does not come: refused (by the person or the browser), missing, or impossible here (a page
// without https, an old browser)
export type Refusal = 'refused' | 'absent' | 'unsupported'
export class MicError extends Error {
  constructor(readonly why: Refusal) {
    super(why)
  }
}

// (midi: the note; level: the volume, from 0 to 1)
export type Heard = { midi: number; level: number }

// (to call within a gesture, a click: without it, iOS keeps the sound muted)
export async function listen() {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported')
  // (the context first, during the gesture; resume it after the browser's question)
  const ctx = new AudioContext()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // (noise suppression removes the fan, automatic gain lifts a weak mic)
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
  // (2048 samples: enough to see two periods of a very low voice)
  analyser.fftSize = 2048
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Float32Array(analyser.fftSize)

  // the background noise: it drops quickly towards the quietest heard, rises slowly (only below the threshold)
  let floor = 0.001
  const recent: number[] = []
  let last: Heard | null = null
  let quiet = 0

  return {
    // sensitivity: from 0.5 (you must sing loud) to 2.5 (a murmur is enough); dt: the time since the previous frame
    read(dt: number, sensitivity: number): Heard | null {
      analyser.getFloatTimeDomainData(buf)
      const level = rms(buf)
      const start = Math.max(0.004, floor * 2.5) / sensitivity
      if (level < floor) floor += (level - floor) * 0.3
      else if (level < start) floor = Math.min(0.02, floor + (level - floor) * 0.02)
      const p = level > start ? yin(buf, ctx.sampleRate) : null
      if (p && p.clarity > 0.75) {
        quiet = 0
        recent.push(toMidi(p.hz))
        if (recent.length > 5) recent.shift()
        const sorted = [...recent].sort((a, b) => a - b)
        last = { midi: sorted[sorted.length >> 1], level: Math.min(1, (level - start) / (start * 25)) }
        return last
      }
      // (a short gap, between two syllables: keep the note)
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
