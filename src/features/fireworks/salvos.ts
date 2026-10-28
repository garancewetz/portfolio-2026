// Les gestes du spectacle (voir Fireworks.tsx) : les salves sur les deux plans, et la lumière des gerbes proches
// sur les cartes.

export const around = (a: number, b: number) => a + Math.random() * (b - a)

// les deux plans ensemble : une gerbe, une fusée vont dans le plan qui convient à leur taille (near : forcer le
// plan proche)
export interface Planes {
  burst(x: number, y: number, size: number, near?: boolean): void
  launch(x: number, y: number, size: number, trail?: number, near?: boolean): void
}

// les salves, en deux gestes : des fusées qui montent tout autour (climb), puis des gerbes en rafale réparties sur
// tout l'écran (spread) ; alive : le mode est encore allumé
export const climb = (show: Planes, alive: () => boolean) => {
  for (let i = 0; i < 6; i++) {
    setTimeout(
      () => alive() && show.launch(innerWidth * around(0.05, 0.95), innerHeight * around(0.06, 0.4), around(1, 1.8)),
      150 + i * 160,
    )
  }
}
// la lumière des gerbes proches sur les cartes : chaque capture à portée reçoit un reflet de la couleur de
// l'explosion, venu de son côté, d'autant plus fort qu'elle est près, et qui s'éteint avec elle (--glow, animé :
// voir Fireworks.css). (x, y) : le centre de la gerbe ; size : sa taille ; color : sa couleur
const LIGHT_REACH = 520 // px : jusqu'où porte la lumière d'une gerbe de taille 1
const LIGHT_FADE = 1600 // ms
export function lightCards(x: number, y: number, size: number, color: string) {
  const reach = LIGHT_REACH * size
  for (const shot of document.querySelectorAll<HTMLElement>('.rg-card .shot')) {
    const r = shot.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) continue
    // (la distance au bord le plus proche de la capture : une gerbe qui éclate dessus l'éclaire à fond)
    const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
    const k = 1 - d / reach
    if (k < 0.05) continue
    shot.style.setProperty('--gx', `${x - r.left}px`)
    shot.style.setProperty('--gy', `${y - r.top}px`)
    // (le reflet s'éteint en traversant la capture : plus fort du côté de la gerbe)
    shot.style.setProperty('--gr', `${d + r.width * 1.1}px`)
    shot.style.setProperty('--gc', color)
    shot.animate([{ '--glow': k }, { '--glow': 0 }], { duration: LIGHT_FADE, easing: 'cubic-bezier(0.1, 0.6, 0.3, 1)' })
  }
}

// n gerbes en rafale, réparties sur toute la largeur (une par tranche, placée au hasard dedans) et dans le haut de
// l'écran, à quelques dixièmes de seconde d'écart
export const spread = (show: Planes, n: number, alive: () => boolean) => {
  for (let i = 0; i < n; i++) {
    setTimeout(
      () =>
        alive() &&
        show.burst(
          innerWidth * (0.04 + (0.92 * (i + Math.random())) / n),
          innerHeight * around(0.1, 0.62),
          around(0.9, 2),
        ),
      i * around(40, 110),
    )
  }
}
