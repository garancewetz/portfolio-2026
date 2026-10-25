// Les oiseaux (voir main.ts) : chacun sa place dans la nappe, son retard, son rythme ; et le déroulé du vol
// (quand ils s'envolent, quand ils se reposent).

// MAX : la place réservée (le plus grand vol possible) ; les réglages (la roue crantée, voir settings.ts) disent
// combien volent, à quelle vitesse, et combien de temps
export const MAX = 15000
export const settings = { count: 6000, speed: 1, fly: 25 }
// le déroulé, en secondes de vol : au départ, ils sont posés ; un clic les fait s'envoler (étalés sur quelques
// secondes, chacun mettant LIFT_TIME secondes à rejoindre le nuage) ; settings.fly secondes après, ils se reposent (étalés
// sur LAND_SPREAD secondes, chacun mettant jusqu'à LAND_TIME secondes à descendre à sa place) ; et ainsi de suite
const LIFT_TIME = 2.5
export const LAND_SPREAD = 10
// (le plus long : chacun met entre la moitié et la totalité de ce temps)
const LAND_TIME = 5
// les zones où ils se posent (des morceaux de toits et de sol), qui se remplissent l'une après l'autre
export const ZONES = 8
// avant de se poser, le nuage s'abaisse au-dessus du village et se resserre (pendant DESCENT secondes, à partir de
// quelques secondes avant les premiers posés) ; à l'envol, il se forme d'abord là, bas et serré, puis monte
export const DESCENT = 7
export const RISE = 8
// chaque envol : son instant (en secondes de vol) et l'endroit du clic (d'où part l'alarme)
let lifts: { at: number; x: number; y: number }[] = []
// un envol à l'instant clock, depuis (x, y) (ceux qui étaient prévus après sont oubliés)
export function lift(clock: number, x: number, y: number) {
  lifts = [...lifts.filter(({ at }) => at < clock), { at: clock, x, y }]
}
// où en est le vol à l'instant clock : depuis quand ils sont partis (ou null), et quand ils se poseront
export function cycle(clock: number) {
  let landAt = -Infinity
  let liftAt: number | null = null
  let fromX = 0
  let fromY = 0
  for (const { at, x, y } of lifts) {
    if (at <= clock && at >= landAt + LAND_SPREAD + LAND_TIME) {
      liftAt = at
      landAt = at + settings.fly
      fromX = x
      fromY = y
    }
  }
  return { landAt, liftAt, fromX, fromY }
}
// tous posés ?
export const landed = (clock: number) => clock >= cycle(clock).landAt + LAND_SPREAD + LAND_TIME
// le plus grand retard d'un oiseau sur ceux de devant, en secondes (un virage traverse le nuage en une
// demi-seconde environ, comme chez les vrais étourneaux)
export const MAX_LAG = 0.6
// (les retards sont rangés en quelques paliers : la pose de la nappe n'est calculée qu'une fois par palier)
export const LAGS = 48
// chaque oiseau : sa place dans la nappe (u, v, dans un disque), son retard, et un peu de flottement à lui
export const u = new Float32Array(MAX)
export const v = new Float32Array(MAX)
export const seed = new Float32Array(MAX)
export const lag = new Uint8Array(MAX)
// l'écart de chaque oiseau à sa place, quand la souris l'a fait fuir (en pixels), et son élan
export const ox = new Float32Array(MAX)
export const oy = new Float32Array(MAX)
export const ovx = new Float32Array(MAX)
export const ovy = new Float32Array(MAX)
// à l'envol, l'alarme part de l'endroit du clic et gagne de proche en proche (ALARM pixels par seconde) : chaque
// oiseau part quand elle l'atteint, avec un petit retard à lui, et met son propre temps à rejoindre le nuage
export const leave = new Float32Array(MAX)
export const leaveTime = new Float32Array(MAX)
export const ALARM = 450
// quand il se pose (secondes après le début de l'atterrissage : ils ne se posent pas tous ensemble)
export const settle = new Float32Array(MAX)
// (et le temps qu'il met à descendre)
export const landTime = new Float32Array(MAX)
for (let i = 0; i < MAX; i++) {
  const a = Math.random() * Math.PI * 2
  // (un disque aux bords effilochés : quelques oiseaux isolés autour du nuage)
  const r = i % 16 === 0 ? 1 + 0.5 * Math.random() : Math.sqrt(Math.random())
  u[i] = r * Math.cos(a) * (1 + 0.15 * Math.random())
  v[i] = r * Math.sin(a) * (1 + 0.15 * Math.random())
  seed[i] = Math.random() * 1000
  // ceux de derrière (u petit) et des bords suivent avec plus de retard, et chacun a un peu le sien : un virage
  // part de l'avant et se propage dans le nuage, qui s'étire en traînées
  const late = 0.5 * (1 - (u[i] + 1) / 2) + 0.2 * Math.abs(v[i]) + 0.3 * Math.random()
  lag[i] = Math.min(LAGS - 1, Math.floor(Math.max(0, late) * LAGS))
  landTime[i] = LAND_TIME * (0.5 + 0.5 * Math.random())
  leave[i] = 0.6 * Math.random() ** 2
  leaveTime[i] = LIFT_TIME * (0.7 + 0.8 * Math.random())
}
