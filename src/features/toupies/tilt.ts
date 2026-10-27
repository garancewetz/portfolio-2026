// La pente : sur un téléphone, on penche l'appareil et la page penche avec lui — les toupies qui tournent glissent
// vers le bas (couchées, elles frottent et restent : voir spin.ts). Le repos est la façon dont on le tient au
// premier geste (personne ne tient son téléphone à plat) ; un petit jeu autour, pour qu'une main qui tremble ne fasse
// rien glisser. Sans capteur (un ordinateur), la page reste plate. Rien ne quitte l'appareil.

// le jeu autour du repos, et la pente la plus forte (en degrés)
const PLAY = 3
const STEEPEST = 30

export function tilt() {
  const slope = { x: 0, z: 0 }
  let rest: { beta: number; gamma: number } | null = null
  const ease = (deg: number) => {
    const d = Math.sign(deg) * Math.max(0, Math.abs(deg) - PLAY)
    return Math.sin((Math.max(-STEEPEST, Math.min(STEEPEST, d)) * Math.PI) / 180)
  }
  const listen = () =>
    addEventListener('deviceorientation', (e) => {
      if (e.beta === null || e.gamma === null) return
      rest ??= { beta: e.beta, gamma: e.gamma }
      // beta : penché d'avant en arrière ; gamma : de gauche à droite (l'appareil debout, en portrait)
      const b = ease(e.beta - rest.beta)
      const g = ease(e.gamma - rest.gamma)
      // (l'écran tourné en paysage : les axes de l'appareil ne sont plus ceux de l'écran)
      const turn = screen.orientation?.angle ?? 0
      if (turn === 90) Object.assign(slope, { x: b, z: -g })
      else if (turn === 270) Object.assign(slope, { x: -b, z: g })
      else Object.assign(slope, { x: g, z: b })
    })
  // (l'écran tourne : on reprend le repos)
  screen.orientation?.addEventListener('change', () => (rest = null))

  // (sur iPhone, il faut la permission, demandée au premier geste)
  type Ask = { requestPermission?: () => Promise<string> }
  const sensor = typeof DeviceOrientationEvent === 'undefined' ? null : (DeviceOrientationEvent as unknown as Ask)
  const ask = sensor?.requestPermission
  let asked = false
  return {
    slope,
    start() {
      if (asked) return
      asked = true
      if (!sensor) return
      if (!ask) return listen()
      ask
        .call(sensor)
        .then((answer) => answer === 'granted' && listen())
        .catch(() => {})
    },
  }
}
