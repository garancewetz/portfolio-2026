// ——— La pose de la nappe à l'instant t : où elle est, comment elle tourne, s'étire et se plie ———
// (des sommes de lentes oscillations qui ne retombent jamais en phase : le mouvement ne se répète pas)
export interface Pose {
  cx: number
  cy: number
  cyw: number
  syw: number
  cp: number
  sp: number
  cr: number
  sr: number
  stretchX: number
  stretchY: number
  bend: number
  wave: number
  t: number
}
export function pose(t: number, W: number, H: number): Pose {
  // le centre du vol dérive dans le haut du ciel, au-dessus du village
  // (lentement : vu de loin, le nuage traverse le ciel en une minute ou deux)
  const cx = W * (0.46 + 0.18 * Math.sin(t * 0.07) + 0.07 * Math.sin(t * 0.16 + 1) + 0.03 * Math.sin(t * 0.31))
  const cy = H * (0.36 + 0.08 * Math.sin(t * 0.09 + 1) + 0.04 * Math.sin(t * 0.21) + 0.02 * Math.sin(t * 0.45 + 2))
  // la nappe tourne sur elle-même (lacet, tangage, roulis) : comme un vrai vol, elle vire en quelques secondes
  const yaw = t * 0.25 + 1.2 * Math.sin(t * 0.35) + 0.5 * Math.sin(t * 0.9 + 2)
  const pitch = 0.9 * Math.sin(t * 0.5 + 0.4) + 0.35 * Math.sin(t * 1.1)
  const roll = 0.6 * Math.sin(t * 0.4 + 2) + 0.25 * Math.sin(t * 0.95 + 1)
  // le faucon : toutes les vingt secondes, une vague traverse la nappe en une seconde
  const hunt = t % 20
  return {
    cx,
    cy,
    cyw: Math.cos(yaw),
    syw: Math.sin(yaw),
    cp: Math.cos(pitch),
    sp: Math.sin(pitch),
    cr: Math.cos(roll),
    sr: Math.sin(roll),
    // elle s'étire et se resserre, et se plie plus ou moins
    stretchX: 1 + 0.25 * Math.sin(t * 0.6) + 0.1 * Math.sin(t * 1.4 + 1),
    stretchY: 0.55 + 0.18 * Math.sin(t * 0.5 + 2) + 0.07 * Math.sin(t * 1.2),
    bend: 1.0 * Math.sin(t * 0.45 + 1) + 0.4 * Math.sin(t * 1.1 + 3),
    wave: hunt < 1 ? -1.6 + hunt * 3.2 : 99,
    t,
  }
}
