import type { Keys, Where } from './body'

// Ce qu'on lui fait faire. Au clavier : les flèches, la barre d'espace (saut). À la souris, au doigt : appuyer sur
// lui l'attrape (il pend au curseur, on le promène, on le lâche : il part avec l'élan) ; appuyer ailleurs, et garder
// appuyé, le dirige vers ce point.

type Body = { where: Where; x: number; y: number }

const KEY: Record<string, keyof Keys> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ' ': 'jump',
}

export function input(
  main: HTMLElement,
  o: {
    body: Body
    size: () => { w: number; h: number }
    /** un geste (le premier le forme) */
    onGesture: () => void
    /** lâché par la souris, avec cet élan (px/s) */
    drop: (vx: number, vy: number) => void
    /** promené à la souris, vers ce point (il peut s'y cogner, voir body.ts) */
    drag: (x: number, y: number) => void
  },
) {
  const keys: Keys = { left: false, right: false, up: false, down: false, jump: false }
  const press = (on: boolean) => (e: KeyboardEvent) => {
    const k = KEY[e.key]
    if (!k) return
    e.preventDefault()
    // (le saut : un appui, un saut ; il ne se répète pas en gardant la touche, voir body.ts)
    if (k === 'jump') {
      if (on && !e.repeat) keys.jump = true
    } else keys[k] = on
    if (on) o.onGesture()
  }
  addEventListener('keydown', press(true))
  addEventListener('keyup', press(false))
  // (en quittant la fenêtre, plus rien n'est tenu)
  addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k as keyof Keys] = false)))

  let pointer: { x: number; y: number } | null = null
  let carry: { t: number; x: number; y: number; vx: number; vy: number } | null = null
  const at = (e: PointerEvent) => {
    const r = main.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  // (sur lui : dans sa boîte, un peu agrandie)
  const onHim = (p: { x: number; y: number }) => {
    const { w, h } = o.size()
    const b = o.body
    return p.x > b.x - 10 && p.x < b.x + w + 10 && p.y > b.y - 10 && p.y < b.y + h + 10
  }
  main.addEventListener('pointerdown', (e) => {
    main.setPointerCapture(e.pointerId)
    const p = at(e)
    const where = o.body.where
    if (onHim(p) && where !== 'away' && where !== 'sleep') {
      carry = { t: performance.now(), ...p, vx: 0, vy: 0 }
      o.body.where = 'carried'
      hold(p)
    } else pointer = p
    o.onGesture()
  })
  // promené : sa main sous le curseur ; l'élan, d'après les derniers mouvements
  function hold(p: { x: number; y: number }) {
    const { w } = o.size()
    o.drag(p.x - w / 2, p.y - 4)
  }
  main.addEventListener('pointermove', (e) => {
    const p = at(e)
    if (carry) {
      const now = performance.now()
      const dt = Math.max(1, now - carry.t) / 1000
      carry = { t: now, ...p, vx: (p.x - carry.x) / dt, vy: (p.y - carry.y) / dt }
      hold(p)
    } else if (pointer) pointer = p
  })
  for (const type of ['pointerup', 'pointercancel'] as const)
    main.addEventListener(type, () => {
      if (carry) {
        // (la souris immobile depuis un moment : il tombe droit, sans élan)
        const still = performance.now() - carry.t > 90
        const clamp = (n: number) => (still ? 0 : Math.max(-1600, Math.min(1600, n)))
        o.drop(clamp(carry.vx), clamp(carry.vy))
      }
      carry = null
      pointer = null
    })

  // les flèches tenues ; ou, en appuyant ailleurs que sur lui, la direction du point (sur l'axe où il est le plus loin)
  function steer(): Keys {
    if (!pointer) return keys
    const { w, h } = o.size()
    const b = o.body
    const dx = pointer.x - (b.x + w / 2)
    const dy = pointer.y - (b.y + h / 2)
    const far = 12 // px : assez près, il s'arrête
    const across = Math.abs(dx) > Math.abs(dy) || b.where === 'floor' || b.where === 'ceiling'
    return {
      left: (across || Math.abs(dy) < far) && dx < -far,
      right: (across || Math.abs(dy) < far) && dx > far,
      up: dy < -far && (b.where !== 'floor' || Math.abs(dx) < w * 2),
      down: dy > far,
    }
  }
  return { keys, steer }
}
