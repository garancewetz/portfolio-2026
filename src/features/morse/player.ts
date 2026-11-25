import type { Mark } from './code'

// Playback: a beep (Web Audio, a pure tone, ~600 Hz) and a light, on the same clock (the sound's, more accurate
// than the frame's). All marks are laid on the clock in advance; on each frame, we check where we are: the lit
// mark (or none, during a silence) and the sign being read.

// (the beep's volume, and the time it takes to rise and fall: without it, every mark would click)
const VOLUME = 0.18
const EDGE = 0.006

export type Frame = { mark: Mark | null; sign: number }

export function createPlayer(onFrame: (f: Frame) => void, onEnd: () => void) {
  let audio: AudioContext | null = null
  let tone: OscillatorNode | null = null
  let raf = 0

  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    tone?.stop()
    tone?.disconnect()
    tone = null
  }

  // unit: the length of one unit, in seconds; hz: the beep's pitch; sound: with sound, or light only
  function play(marks: Mark[], units: number, o: { unit: number; hz: number; sound: boolean }) {
    stop()
    audio ??= 'AudioContext' in window ? new AudioContext() : null
    void audio?.resume()
    const now = () => (audio ? audio.currentTime : performance.now() / 1000)
    // (a short pause before the first mark: so the sound has started)
    const start = now() + 0.08

    if (audio && o.sound) {
      tone = audio.createOscillator()
      tone.frequency.value = o.hz
      const gain = audio.createGain()
      gain.gain.value = 0
      for (const { at, length } of marks) {
        const on = start + at * o.unit
        const off = on + length * o.unit
        gain.gain.setValueAtTime(0, on)
        gain.gain.linearRampToValueAtTime(VOLUME, on + EDGE)
        gain.gain.setValueAtTime(VOLUME, off - EDGE)
        gain.gain.linearRampToValueAtTime(0, off)
      }
      tone.connect(gain).connect(audio.destination)
      tone.start(start)
      tone.stop(start + units * o.unit)
    }

    let k = 0
    const frame = () => {
      const t = (now() - start) / o.unit
      if (t >= units) {
        stop()
        onFrame({ mark: null, sign: -1 })
        onEnd()
        return
      }
      while (k < marks.length - 1 && marks[k + 1].at <= t) k++
      const m = marks[k]
      const lit = t >= m.at && t < m.at + m.length
      onFrame({ mark: lit ? m : null, sign: t >= marks[0].at ? m.sign : -1 })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
  }

  return { play, stop, playing: () => raf !== 0 }
}
