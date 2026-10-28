// Deux fenêtres (ou plus), la page ouverte dans chacune, côte à côte sur l'écran : il n'y a qu'un bonhomme, et il
// passe de l'une à l'autre. Les fenêtres se parlent (BroadcastChannel, dans ce navigateur seulement : rien ne sort
// de l'ordinateur) : chacune dit où elle est sur l'écran ; quand il marche contre le bord d'une fenêtre et qu'une
// autre touche ce bord, il y entre, à la même hauteur sur l'écran. Une page qui s'ouvre alors qu'il est déjà
// ailleurs reste vide ; s'il était dans une fenêtre qu'on ferme, une autre le reprend.

type Rect = { left: number; top: number; right: number; bottom: number }
type Msg =
  | { t: 'hello'; id: string }
  | { t: 'here'; id: string; has: boolean }
  | { t: 'rect'; id: string; r: Rect; has: boolean }
  | { t: 'take'; to: string; y: number; side: -1 | 1; floor: boolean }
  | { t: 'bye'; id: string; had: boolean }

const NEAR = 90 // px sur l'écran : deux bords plus proches que ça se touchent

// la page dans l'écran (le haut de la fenêtre moins ses barres)
export const screenRect = (): Rect => {
  const left = screenX + (outerWidth - innerWidth) / 2
  const top = screenY + (outerHeight - innerHeight)
  return { left, top, right: left + innerWidth, bottom: top + innerHeight }
}

export function windows(o: {
  /** il est ici en ce moment */
  has: () => boolean
  /** une autre fenêtre l'a déjà : cette page reste vide */
  leave: () => void
  /** il arrive par ce bord (-1 : gauche), à cette hauteur dans la page (px), au sol ou pas */
  enter: (side: -1 | 1, y: number, floor: boolean) => void
  /** personne ne l'a plus : il revient ici, au milieu */
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
      // (s'il était là-bas : la fenêtre restante au plus petit nom le reprend)
      if (m.had && !o.has() && [...others.keys(), id].sort()[0] === id) o.adopt()
    }
  }
  post({ t: 'hello', id })
  const tell = () => post({ t: 'rect', id, r: screenRect(), has: o.has() })
  tell()
  setInterval(tell, 400)
  addEventListener('pagehide', () => post({ t: 'bye', id, had: o.has() }))

  return {
    // une fenêtre qui touche ce bord (-1 : gauche, 1 : droite) à cette hauteur sur l'écran
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
    // il y passe : par le bord opposé, à cette hauteur sur l'écran
    send(to: string, side: -1 | 1, y: number, floor: boolean) {
      post({ t: 'take', to, y, side: -side as -1 | 1, floor })
    },
  }
}
