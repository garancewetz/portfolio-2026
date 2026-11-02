// La voix, au micro : à chaque image, est-ce qu'on fait un son, et à quel volume. Pas de hauteur ni de note juste :
// « aaah », « ooouh », un fredonnement, tout compte, dès que c'est plus fort que le bruit de la pièce (un seuil, qui
// suit le bruit de fond, avec un peu d'écart entre « ça commence » et « ça s'arrête », pour ne pas clignoter). Un
// petit trou entre deux souffles ne coupe pas le son. Rien n'est enregistré ni envoyé : le son reste dans le
// navigateur.

// pourquoi le micro ne vient pas : refusé (par la personne ou le navigateur), absent, ou impossible ici (une page
// sans https, un vieux navigateur)
export type Refusal = 'refused' | 'absent' | 'unsupported'
export class MicError extends Error {
  constructor(readonly why: Refusal) {
    super(why)
  }
}

// (on : on fait un son ; level : son volume, de 0 à 1 au-dessus du seuil ; meter : le volume brut, pour une jauge,
// le seuil à mi-hauteur)
export type Heard = { on: boolean; level: number; meter: number }

// le volume (la moyenne quadratique du signal)
function rms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

// (à appeler dans un geste, un clic : sans lui, iOS garde le son coupé)
export async function listen() {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported')
  // (le contexte d'abord, pendant le geste ; on le reprend après la question du navigateur)
  const ctx = new AudioContext()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // (la réduction de bruit garde la voix et efface le ventilateur, le gain automatique remonte une voix
      // lointaine ou un micro faible : ici, ils aident)
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
  analyser.fftSize = 1024
  ctx.createMediaStreamSource(stream).connect(analyser)
  const buf = new Float32Array(analyser.fftSize)

  // le bruit de fond : il descend vite vers le plus calme qu'on a entendu, remonte lentement (et seulement sous le
  // seuil, pas pendant qu'on fait un son)
  let floor = 0.001
  let on = false
  let quiet = 0

  return {
    // sensitivity : de 0,5 (il faut parler fort) à 2 (un murmure suffit) ; dt : le temps depuis l'image d'avant
    read(dt: number, sensitivity = 1): Heard {
      analyser.getFloatTimeDomainData(buf)
      const level = rms(buf)
      // (un seuil bas : la réduction de bruit du navigateur a déjà fait taire la pièce)
      const start = Math.max(0.004, floor * 2.5) / sensitivity
      if (level < floor) floor += (level - floor) * 0.3
      else if (!on && level < start) floor = Math.min(0.02, floor + (level - floor) * 0.02)
      if (level > (on ? start * 0.55 : start)) {
        on = true
        quiet = 0
      } else if (on && (quiet += dt) > 0.09) on = false
      return {
        on,
        level: Math.max(0, Math.min(1, (level - start * 0.55) / (start * 6))),
        meter: Math.min(1, (level / start) * 0.5),
      }
    },
    stop() {
      for (const t of stream.getTracks()) t.stop()
      ctx.close()
    },
  }
}
export type Voice = Awaited<ReturnType<typeof listen>>
