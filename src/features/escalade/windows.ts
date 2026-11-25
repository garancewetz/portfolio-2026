// Two windows (or more), the page open in each, side by side on the screen: there is only one little man, and he
// goes from one to the other. The windows talk to each other (BroadcastChannel, in this browser only: nothing
// leaves the computer): each one says where it is on the screen; when he walks against the edge of a window and
// another one touches that edge, he enters it, at the same height on the screen. A page that opens while he is
// already elsewhere stays empty; if he was in a window that gets closed, another one takes him back.

type Rect = { left: number; top: number; right: number; bottom: number }
type Msg =
  | { t: 'hello'; id: string }
  | { t: 'here'; id: string; has: boolean }
  | { t: 'rect'; id: string; r: Rect; has: boolean }
  | { t: 'take'; to: string; y: number; side: -1 | 1; floor: boolean }
  | { t: 'bye'; id: string; had: boolean }

const NEAR = 90 // px on the screen: two edges closer than that touch

// the page on the screen (the top of the window minus its bars)
export const screenRect = (): Rect => {
  const left = screenX + (outerWidth - innerWidth) / 2
  const top = screenY + (outerHeight - innerHeight)
  return { left, top, right: left + innerWidth, bottom: top + innerHeight }
}

export function windows(o: {
  /** he is here right now */
  has: () => boolean
  /** another window already has him: this page stays empty */
  leave: () => void
  /** he arrives through this edge (-1: left), at this height in the page (px), on the ground or not */
  enter: (side: -1 | 1, y: number, floor: boolean) => void
  /** nobody has him any more: he comes back here, in the middle */
  adopt: () => void
}) {
  const id = Math.random().toString(36).slice(2)
  const others = new Map<string, { r: Rect; has: boolean; seen: number }>()
  let ch: BroadcastChannel | null = null
  try {
    ch = new BroadcastChannel('escalade')
  } catch {
    return { neighbour: () => null, send: () => {} }
  }
  const post = (m: Msg) => ch?.postMessage(m)

  ch.onmessage = ({ data: m }: MessageEvent<Msg>) => {
    if (m.t === 'hello') post({ t: 'here', id, has: o.has() })
    else if (m.t === 'here' && m.has) o.leave()
    else if (m.t === 'rect') others.set(m.id, { r: m.r, has: m.has, seen: performance.now() })
    else if (m.t === 'take' && m.to === id) {
      const me = screenRect()
      o.enter(m.side, m.y - me.top, m.floor)
    } else if (m.t === 'bye') {
      others.delete(m.id)
      // (if he was over there: the remaining window with the smallest name takes him back)
      if (m.had && !o.has() && [...others.keys(), id].sort()[0] === id) o.adopt()
    }
  }
  post({ t: 'hello', id })
  const tell = () => post({ t: 'rect', id, r: screenRect(), has: o.has() })
  tell()
  setInterval(tell, 400)
  addEventListener('pagehide', () => post({ t: 'bye', id, had: o.has() }))

  return {
    // a window touching this edge (-1: left, 1: right) at this height on the screen
    neighbour(side: -1 | 1, y: number) {
      const me = screenRect()
      const now = performance.now()
      for (const [other, { r, seen }] of others) {
        if (now - seen > 2000) continue
        const touch = side === 1 ? Math.abs(r.left - me.right) < NEAR : Math.abs(r.right - me.left) < NEAR
        if (touch && y >= r.top && y <= r.bottom) return other
      }
      return null
    },
    // he crosses into it: through the opposite edge, at this height on the screen
    send(to: string, side: -1 | 1, y: number, floor: boolean) {
      post({ t: 'take', to, y, side: -side as -1 | 1, floor })
    },
  }
}
