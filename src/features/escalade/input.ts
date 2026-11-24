import type { Keys, Where } from './body'

// What you make him do. On the keyboard: the arrows, the space bar (jump). With the mouse, with a finger:
// pressing on him grabs him (he hangs from the cursor, you carry him, you drop him: he goes off with the
// momentum); pressing elsewhere, and holding, steers him towards that point.

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
    /** a move (the first one forms him) */
    onGesture: () => void
    /** dropped by the mouse, with this momentum (px/s) */
    drop: (vx: number, vy: number) => void
    /** dragged by the mouse, towards this point (he may bump into things, see body.ts) */
    drag: (x: number, y: number) => void
  },
) {
  const keys: Keys = { left: false, right: false, up: false, down: false, jump: false }
  const press = (on: boolean) => (e: KeyboardEvent) => {
    const k = KEY[e.key]
    if (!k) return
    e.preventDefault()
    // (the jump: one press, one jump; it does not repeat while holding the key, see body.ts)
    if (k === 'jump') {
      if (on && !e.repeat) keys.jump = true
    } else keys[k] = on
    if (on) o.onGesture()
  }
  addEventListener('keydown', press(true))
  addEventListener('keyup', press(false))
  // (leaving the window, nothing is held any more)
  addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k as keyof Keys] = false)))

  let pointer: { x: number; y: number } | null = null
  let carry: { t: number; x: number; y: number; vx: number; vy: number } | null = null
  const at = (e: PointerEvent) => {
    const r = main.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  // (on him: inside his box, slightly enlarged)
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
  // dragged: his hand under the cursor; the momentum, from the latest movements
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
        // (the mouse still for a while: he drops straight, without momentum)
        const still = performance.now() - carry.t > 90
        const clamp = (n: number) => (still ? 0 : Math.max(-1600, Math.min(1600, n)))
        o.drop(clamp(carry.vx), clamp(carry.vy))
      }
      carry = null
      pointer = null
    })

  // the arrows held; or, pressing elsewhere than on him, the direction of the point (on the axis where it is
  // farthest)
  function steer(): Keys {
    if (!pointer) return keys
    const { w, h } = o.size()
    const b = o.body
    const dx = pointer.x - (b.x + w / 2)
    const dy = pointer.y - (b.y + h / 2)
    const far = 12 // px: close enough, he stops
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
