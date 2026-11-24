// The show's gestures (see Fireworks.tsx): the salvos on both planes, and the light of near bursts on the
// cards.

export const around = (a: number, b: number) => a + Math.random() * (b - a)

// both planes together: a burst, a rocket go into the plane that suits their size (near: force the near
// plane)
export interface Planes {
  burst(x: number, y: number, size: number, near?: boolean): void
  launch(x: number, y: number, size: number, trail?: number, near?: boolean): void
}

// the salvos, in two gestures: rockets rising all around (climb), then bursts in quick succession spread over the
// whole screen (spread); alive: the mode is still on
export const climb = (show: Planes, alive: () => boolean) => {
  for (let i = 0; i < 6; i++) {
    setTimeout(
      () => alive() && show.launch(innerWidth * around(0.05, 0.95), innerHeight * around(0.06, 0.4), around(1, 1.8)),
      150 + i * 160,
    )
  }
}
// the light of near bursts on the cards: each screenshot within reach gets a reflection in the explosion's
// colour, coming from its side, the stronger the closer it is, and dying out with it (--glow, animated: see
// Fireworks.css). (x, y): the centre of the burst; size: its size; color: its colour
const LIGHT_REACH = 520 // px: how far the light of a size-1 burst reaches
const LIGHT_FADE = 1600 // ms
export function lightCards(x: number, y: number, size: number, color: string) {
  const reach = LIGHT_REACH * size
  for (const shot of document.querySelectorAll<HTMLElement>('.rg-card .shot')) {
    const r = shot.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) continue
    // (the distance to the closest edge of the screenshot: a burst right over it lights it fully)
    const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
    const k = 1 - d / reach
    if (k < 0.05) continue
    shot.style.setProperty('--gx', `${x - r.left}px`)
    shot.style.setProperty('--gy', `${y - r.top}px`)
    // (the reflection fades across the screenshot: stronger on the burst's side)
    shot.style.setProperty('--gr', `${d + r.width * 1.1}px`)
    shot.style.setProperty('--gc', color)
    shot.animate([{ '--glow': k }, { '--glow': 0 }], { duration: LIGHT_FADE, easing: 'cubic-bezier(0.1, 0.6, 0.3, 1)' })
  }
}

// n bursts in quick succession, spread over the whole width (one per slice, placed at random inside it) and
// in the top of the screen, a few tenths of a second apart
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
