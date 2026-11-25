// The slope: on a phone, you tilt the device and the page tilts with it — the spinning tops slide downwards
// (lying down, they rub and stay: see spin.ts). Rest is the way you hold it at the first gesture (nobody holds
// their phone flat); a little play around it, so a shaky hand does not make anything slide. Without a sensor (a
// computer), the page stays flat. Nothing leaves the device.

// the play around rest, and the steepest slope (in degrees)
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
      // beta: tilted front to back; gamma: left to right (the device upright, in portrait)
      const b = ease(e.beta - rest.beta)
      const g = ease(e.gamma - rest.gamma)
      // (the screen turned to landscape: the device's axes are no longer the screen's)
      const turn = screen.orientation?.angle ?? 0
      if (turn === 90) Object.assign(slope, { x: b, z: -g })
      else if (turn === 270) Object.assign(slope, { x: -b, z: g })
      else Object.assign(slope, { x: g, z: b })
    })
  // (the screen rotates: take rest again)
  screen.orientation?.addEventListener('change', () => (rest = null))

  // (on iPhone, permission is needed, asked at the first gesture)
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
