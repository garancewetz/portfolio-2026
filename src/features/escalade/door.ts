// La porte : le but du jeu. Une petite porte en caractères, quelque part au milieu de la page, trop haute pour qu'il
// l'atteigne en sautant. Il faut lui dessiner des traits, et les escalader jusque-là (trail.ts, body.ts). Arrivé
// devant la porte, il fait coucou ; la porte s'ouvre, il entre, elle se referme (voir main.ts).

const SHUT = ['.---.', '|   |', '|  o|', '|   |']
const OPEN = ['.---.', '|▒▒▒|', '|▒▒▒|', '|▒▒▒|']

export function createDoor(main: HTMLElement, size: () => { W: number; H: number }) {
  const el = document.createElement('pre')
  el.className = 'es-door'
  el.setAttribute('aria-hidden', 'true')
  el.textContent = SHUT.join('\n')
  // (sous le bonhomme : il passe devant la porte)
  main.insertBefore(el, main.querySelector('.es-man'))
  let x = 0
  let y = 0

  // une place : au milieu de la page, à hauteur de deux à trois fois ce qu'il peut sauter, loin des bords
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
    // sa place devant la porte (sa boîte, de largeur w et de hauteur h : les pieds sur le bas de la porte)
    front: (w: number, h: number) => ({ x: x + el.offsetWidth / 2 - w / 2, y: y + el.offsetHeight - h }),
    // le milieu de la porte
    middle: () => x + el.offsetWidth / 2,
    // il est arrivé : devant la porte, le milieu de son corps (sa boîte x, y, w, h) dans la porte (la frôler par le
    // bord ne suffit pas)
    reached(bx: number, by: number, w: number, h: number) {
      const cx = bx + w / 2
      const cy = by + h / 2
      return cx > x && cx < x + el.offsetWidth && cy > y && cy < y + el.offsetHeight
    },
  }
}
