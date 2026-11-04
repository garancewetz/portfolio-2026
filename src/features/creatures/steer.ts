// Le yéti, au clavier : ← → le font marcher (et dériver, en l'air), ↑ sauter (tenu : voler), ↓ descendre sur le fil
// du dessous (en l'air : plonger ; guidé, il ne plane plus : il vole, ou il tombe). Une petite flèche, sur sa tête,
// le montre dès l'arrivée. Il se promène à sa façon jusqu'à la première flèche ; ensuite, il ne fait plus rien de
// lui-même : il attend la suivante (voir stage.ts).

export const YETI = 'yéti oreilles sans bras'

// (en pixels par seconde) son élan, en sautant
const LEAP = 380
// (en pixels) la flèche, au-dessus de sa tête ; (par seconde) son balancement
const ABOVE = 6
const BOB = 3

// ce que stage.ts lui fait faire, à la demande
export type Moves = {
  go: (dir: number) => void
  stop: () => void
  jump: (up: number) => void
  drop: () => void
}

export function steer(room: HTMLElement) {
  const keys = { dir: 0, up: false, down: false, lift: false }
  let led = false
  let t = 0
  const SIDE: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }
  addEventListener('keydown', (e) => {
    if (e.key in SIDE) keys.dir = SIDE[e.key]
    // (↑ tenu : il décolle, puis il vole)
    else if (e.key === 'ArrowUp') keys.up = keys.lift = true
    else if (e.key === 'ArrowDown') keys.down = !e.repeat || keys.down
    else return
    e.preventDefault()
    led = true
  })
  addEventListener('keyup', (e) => {
    if (SIDE[e.key] === keys.dir) keys.dir = 0
    if (e.key === 'ArrowUp') keys.lift = false
  })
  addEventListener('blur', () => {
    keys.dir = 0
    keys.lift = false
  })

  const mark = document.createElement('span')
  mark.className = 'cr-mark'
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = '↓'
  room.append(mark)

  return {
    // à chaque image : true dès qu'on l'a guidé
    guided(dt: number) {
      t += dt
      return led
    },
    // debout sur sa ligne : ce qu'on lui demande
    act(m: Moves) {
      if (keys.up) m.jump(LEAP)
      else if (keys.down) m.drop()
      else if (keys.dir) m.go(keys.dir)
      else m.stop()
      keys.up = keys.down = false
    },
    // en l'air : on tient ↑, il vole (il bat des oreilles, et monte)
    flying: () => keys.lift,
    // en l'air : de quel côté on le pousse
    side: () => keys.dir,
    // en l'air : on l'a fait plonger (la flèche du bas)
    fall() {
      const down = keys.down
      keys.down = false
      return down
    },
    // la flèche, au-dessus de sa tête (x : son milieu ; y : le haut de sa tête, depuis le bas)
    mark(x: number, y: number) {
      mark.style.transform = `translate(${x}px, ${-(y + ABOVE + Math.abs(Math.sin(t * BOB)) * 4)}px) translateX(-50%)`
    },
  }
}
