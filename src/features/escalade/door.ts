// The door: the goal of the game. A small door made of characters, somewhere in the middle of the page, too
// high for him to reach by jumping. You have to draw him lines, and he climbs them up to it (trail.ts,
// body.ts). Arrived in front of the door, he waves; the door opens, he goes in, it closes (see main.ts).

const SHUT = ['.---.', '|   |', '|  o|', '|   |']
const OPEN = ['.---.', '|▒▒▒|', '|▒▒▒|', '|▒▒▒|']

export function createDoor(main: HTMLElement, size: () => { W: number; H: number }) {
  const el = document.createElement('pre')
  el.className = 'es-door'
  el.setAttribute('aria-hidden', 'true')
  el.textContent = SHUT.join('\n')
  // (under the little man: he passes in front of the door)
  main.insertBefore(el, main.querySelector('.es-man'))
  let x = 0
  let y = 0

  // a spot: in the middle of the page, two to three times as high as he can jump, far from the edges
  function move() {
    const { W, H } = size()
    x = Math.round(W * (0.3 + Math.random() * 0.4) - el.offsetWidth / 2)
    y = Math.round(H * (0.18 + Math.random() * 0.2))
    el.style.transform = `translate(${x}px, ${y}px)`
    el.textContent = SHUT.join('\n')
  }
  move()

  return {
    move,
    open: () => (el.textContent = OPEN.join('\n')),
    shut: () => (el.textContent = SHUT.join('\n')),
    // his place in front of the door (his box, w wide and h high: feet on the bottom of the door)
    front: (w: number, h: number) => ({ x: x + el.offsetWidth / 2 - w / 2, y: y + el.offsetHeight - h }),
    // the middle of the door
    middle: () => x + el.offsetWidth / 2,
    // he has arrived: in front of the door, the middle of his body (his box x, y, w, h) inside the door (brushing
    // it by the edge is not enough)
    reached(bx: number, by: number, w: number, h: number) {
      const cx = bx + w / 2
      const cy = by + h / 2
      return cx > x && cx < x + el.offsetWidth && cy > y && cy < y + el.offsetHeight
    },
  }
}
