import type { Mark } from './code'

// La lecture : un bip (Web Audio, une note pure, ~600 Hz) et une lumière, sur la même horloge (celle du son, plus
// juste que celle de l'image). Toutes les marques sont posées d'avance sur l'horloge ; à chaque image, on regarde où
// on en est : la marque allumée (ou aucune, dans un silence) et le signe qu'on lit.

// (le volume du bip, et le temps qu'il met à monter et à retomber : sans ça, chaque marque claquerait)
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

  // unit : la durée d'une unité, en secondes ; hz : la note du bip ; sound : avec le son, ou la lumière seule
  function play(marks: Mark[], units: number, o: { unit: number; hz: number; sound: boolean }) {
    stop()
    audio ??= 'AudioContext' in window ? new AudioContext() : null
    void audio?.resume()
    const now = () => (audio ? audio.currentTime : performance.now() / 1000)
    // (un petit temps avant la première marque : que le son ait démarré)
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
