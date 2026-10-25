// L'optique de l'arc-en-ciel, calculée comme dans les livres : rien n'est placé à la main, ni les angles ni les
// couleurs.
//
// 1. Le rayon de Descartes (1637). Un rayon de soleil entre dans une goutte sphérique, s'y réfléchit une fois (arc
//    principal) ou deux fois (arc secondaire), et ressort. Selon l'endroit où il touche la goutte, il est dévié plus
//    ou moins ; mais il existe une déviation minimale, autour de laquelle les rayons s'accumulent : c'est là que
//    la lumière est concentrée (une caustique). L'angle d'incidence de ce rayon vérifie
//    cos²(i) = (n² − 1) / (k(k + 2)), où n est l'indice de l'eau et k le nombre de réflexions internes.
//    Avec n = 1.333 : 42° autour du point antisolaire pour le premier arc, 51° pour le second.
// 2. La dispersion (Newton, 1672). L'indice de l'eau dépend de la longueur d'onde (formule de Cauchy) : le violet
//    est plus dévié que le rouge. Chaque couleur a donc son propre cercle : rouge à 42.4°, violet à 40.6° pour le
//    premier arc (rouge dehors) ; rouge à 50.2°, violet à 53.6° pour le second (inversé, rouge dedans).
// 3. Ce qu'on voit. Pour l'arc principal, la lumière d'une couleur arrive à son angle et à tous les angles plus
//    petits (avec une intensité en 1/√(θc − θ) près du bord, comme toute caustique) : l'intérieur de l'arc est
//    donc éclairé par toutes les couleurs mêlées, d'où un ciel plus clair et blanchâtre sous l'arc. Pour le second,
//    c'est l'inverse (lumière au-delà de son angle). Entre les deux, aucune goutte n'envoie de lumière vers
//    l'œil : la bande sombre d'Alexandre (d'Aphrodise, vers 200). Le second arc est plus pâle : une réflexion de
//    plus, environ 43 % de l'intensité du premier.
// 4. Le flou du soleil. Le soleil n'est pas un point : son disque fait 0.53°, chaque couleur est étalée d'autant.
// 5. La couleur perçue. On additionne tout le spectre visible (400 à 700 nm) à travers les courbes de sensibilité de
//    l'œil (CIE 1931, approximation de Wyman, Sloan et Shirley, 2013), puis on passe en RVB (sRGB).
//
// Seule entorse : en vrai, l'arc ne fait qu'environ 2° de large, soit moins de deux rangées de caractères, et ses
// couleurs se fondraient. On exagère donc la dispersion de l'eau (l'écart d'indice entre le rouge et le violet est
// multiplié par DISPERSION) ; le centre de l'arc, lui, reste à sa vraie place. Et à l'affichage, les couleurs sont
// un peu plus vives que la lumière calculée (voir WASH).

const DISPERSION = 4
const N_YELLOW = 1.3344 // (l'indice de l'eau à 550 nm, autour duquel on exagère)
const SUN_RADIUS = 0.265 // (degrés)
const SECONDARY = 0.43
const WASH = 0.6
const RAD = Math.PI / 180

// l'indice de l'eau selon la longueur d'onde (nm), formule de Cauchy, puis la dispersion exagérée
function waterIndex(nm: number) {
  const n = 1.3242 + 3086 / (nm * nm)
  return N_YELLOW + DISPERSION * (n - N_YELLOW)
}

// l'angle de l'arc (en degrés depuis le point antisolaire) pour un indice n et k réflexions internes
export function bowAngle(n: number, k: number) {
  const i = Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2))))
  const r = Math.asin(Math.sin(i) / n)
  const deviation = (2 * (i - r) + k * (Math.PI - 2 * r)) / RAD
  return k === 1 ? 180 - deviation : deviation - 180
}

// les courbes de sensibilité de l'œil (CIE 1931), approximées par des gaussiennes asymétriques
function lobe(x: number, mu: number, s1: number, s2: number) {
  const t = (x - mu) / (x < mu ? s1 : s2)
  return Math.exp(-0.5 * t * t)
}
function eye(nm: number) {
  return [
    1.056 * lobe(nm, 599.8, 37.9, 31) + 0.362 * lobe(nm, 442, 16, 26.7) - 0.065 * lobe(nm, 501.1, 20.4, 26.2),
    0.821 * lobe(nm, 568.8, 46.9, 40.5) + 0.286 * lobe(nm, 530.9, 16.3, 31.1),
    1.217 * lobe(nm, 437, 11.8, 36) + 0.681 * lobe(nm, 459, 26, 13.8),
  ]
}

// le ciel autour du point antisolaire, de 0 à MAX_ANGLE, par pas de STEP degrés : pour chaque angle, la lumière
// renvoyée par les gouttes (0 à 1, 1 au plus fort de l'arc), à quel point elle est colorée (0 : blanche, 1 : pure),
// et sa couleur toute prête pour le canvas
export const STEP = 0.05
export const MAX_ANGLE = 75
const SIZE = Math.round(MAX_ANGLE / STEP) + 1
export const light = new Float32Array(SIZE)
export const chroma = new Float32Array(SIZE)
export const style: string[] = new Array(SIZE)

const spectrum = Array.from({ length: 31 }, (_, j) => {
  const nm = 400 + j * 10
  const n = waterIndex(nm)
  return { eye: eye(nm), primary: bowAngle(n, 1), secondary: bowAngle(n, 2) }
})
const EPS = 0.03 // (évite l'infini pile sur la caustique ; le disque du soleil lisse de toute façon)
const xyz = new Float32Array(SIZE * 3)
let peak = 0
for (let s = 0; s < SIZE; s++) {
  const theta = s * STEP
  let X = 0
  let Y = 0
  let Z = 0
  for (const w of spectrum) {
    // (le disque du soleil : neuf points pondérés par la largeur du disque à cet endroit)
    let v = 0
    let total = 0
    for (let k = -4; k <= 4; k++) {
      const u = k / 4
      const weight = Math.sqrt(1 - u * u) + 0.05
      const t = theta + u * SUN_RADIUS
      let a = 0
      if (t < w.primary) a += 1 / Math.sqrt(w.primary - t + EPS)
      if (t > w.secondary) a += SECONDARY / Math.sqrt(t - w.secondary + EPS)
      v += a * weight
      total += weight
    }
    v /= total
    X += v * w.eye[0]
    Y += v * w.eye[1]
    Z += v * w.eye[2]
  }
  xyz[s * 3] = X
  xyz[s * 3 + 1] = Y
  xyz[s * 3 + 2] = Z
  peak = Math.max(peak, Y)
}
for (let s = 0; s < SIZE; s++) {
  const X = xyz[s * 3]
  const Y = xyz[s * 3 + 1]
  const Z = xyz[s * 3 + 2]
  // XYZ → RVB linéaire (sRGB), sans les valeurs négatives (couleurs hors de l'écran)
  const r = Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z)
  const g = Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z)
  const b = Math.max(0, 0.0557 * X - 0.204 * Y + 1.057 * Z)
  const max = Math.max(r, g, b, 1e-6)
  const min = Math.min(r, g, b)
  light[s] = Y / peak
  chroma[s] = (max - min) / max
  // (la couleur à pleine luminosité : c'est l'opacité du caractère qui dira son intensité. Pour l'affichage
  // seulement, on retire une part du blanc mêlé à la couleur : un point de caractère est trop petit pour qu'une
  // teinte pâle s'y lise. Puis correction gamma sRGB)
  const out = [r, g, b].map((c) => Math.round(255 * Math.pow((c - WASH * min) / (max - WASH * min), 1 / 2.2)))
  style[s] = `rgb(${out[0]} ${out[1]} ${out[2]})`
}

// l'entrée de la table pour un angle donné (en degrés)
export function at(theta: number) {
  return Math.min(SIZE - 1, Math.round(theta / STEP))
}
