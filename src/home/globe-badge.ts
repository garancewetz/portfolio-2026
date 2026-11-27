// The lab's badge on the home page: a small snow globe drawn in characters. At
// rest, a few flakes lie inside; hovering it (or focusing it) shakes it: the snow whirls, then settles again.

// (two lines: the round glass, two flakes inside, on a short line for its base)
const INSIDE = 2
const REST = '*.'
const FLAKES = ['*', '.', '·', "'", ' ']

// one drawing of the globe, its inside given
const draw = (inside: string) => `(${inside})\n ‾‾ `

export function globeBadge(holder: HTMLElement) {
  const art = document.createElement('span')
  art.className = 'globe-ascii'
  art.setAttribute('aria-hidden', 'true')
  art.textContent = draw(REST)
  holder.prepend(art)
  let timer = 0, left = 0
  const whirl = () => {
    // fewer and fewer flakes in the air as it settles
    left--
    const calmDown = left <= 0
    art.textContent = draw(calmDown ? REST : Array.from({ length: INSIDE }, () => FLAKES[Math.floor(Math.random() * FLAKES.length)]).join(''))
    if (calmDown) { clearInterval(timer); timer = 0 }
  }
  const shake = () => {
    left = 9
    if (!timer) timer = window.setInterval(whirl, 140)
  }
  const link = holder.closest('a') ?? holder
  link.addEventListener('pointerenter', shake)
  link.addEventListener('focus', shake)
}
