// The freed mascots wander the whole site: the browser remembers which ones are out, and in which colour; every
// other page (the home page, the lab's pages) lets them fly over it. Three.js and the mascots are only loaded
// when one is out. They come home only when called back from the Mascottes page.

import type { Snapshot, sky } from './sky'

const KEY = 'mascots-free'
// where they were flying when the last page was left (for the next one, a moment later)
const LAST = 'mascots-flight'
type Freed = Record<string, string | null>

export function freed(): Freed {
  try {
    const all: unknown = JSON.parse(localStorage.getItem(KEY) || '{}')
    // (only a plain record of names and colours: anything else is forgotten)
    if (!all || typeof all !== 'object' || Array.isArray(all)) return {}
    return Object.fromEntries(Object.entries(all).filter(([, c]) => c === null || typeof c === 'string')) as Freed
  } catch {
    return {}
  }
}
// out (in this colour; null: its own), or back home (undefined)
export function remember(key: string, color: string | null | undefined) {
  const all = freed()
  if (color === undefined) delete all[key]
  else all[key] = color
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // (no memory: they stay on the Mascottes page)
  }
}

// (only the page itself: a page shown in an Abyme window shares the tab's memory, and must leave it alone)
const topPage = () => window === window.top
const SNAPSHOT_KEYS = ['x', 'y', 'z', 'vx', 'vy', 'vz', 'turn', 'scale', 'beat'] as const
const isSnapshot = (v: unknown): v is Snapshot =>
  !!v && typeof v === 'object' && SNAPSHOT_KEYS.every((k) => Number.isFinite((v as Record<string, unknown>)[k]))

// on leaving the page, write down where each one flying is; a page coming back from the browser's cache does not
// read it, so it is cleared then
export function keepFlying(flight: Pick<ReturnType<typeof sky>, 'where'>, keys: string[]) {
  if (!topPage()) return
  addEventListener('pagehide', () => {
    const at: Record<string, Snapshot> = {}
    keys.forEach((key, i) => {
      const was = flight.where(i)
      if (was) at[key] = was
    })
    try {
      sessionStorage.setItem(LAST, JSON.stringify({ t: Date.now(), at }))
    } catch {
      // (no memory: they come in from a side)
    }
  })
  addEventListener('pageshow', (e) => {
    if (e.persisted) lastSeen()
  })
}
// where they were flying when the last page was left, a moment ago (read once)
export function lastSeen(): Record<string, Snapshot> {
  if (!topPage()) return {}
  try {
    const last = JSON.parse(sessionStorage.getItem(LAST) || 'null') as { t?: unknown; at?: unknown } | null
    sessionStorage.removeItem(LAST)
    if (!last || typeof last.t !== 'number' || Date.now() - last.t > 15000 || !last.at || typeof last.at !== 'object') return {}
    return Object.fromEntries(Object.entries(last.at).filter(([, v]) => isSnapshot(v))) as Record<string, Snapshot>
  } catch {
    return {}
  }
}

export async function roam() {
  // (not on the Mascottes page, which frees them itself; not in an Abyme window; not for whoever asked for less motion)
  if (location.pathname.startsWith('/lab/mascots') || !topPage() || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const out = freed()
  if (!Object.keys(out).length) return
  const modules = await Promise.all([import('./roster'), import('./sky'), import('./fur')]).catch(() => null)
  if (!modules) return // (offline: they will fly next time)
  const [{ ROSTER }, { sky }, { dye }] = modules
  const members = ROSTER.filter((m) => m.key in out)
  if (!members.length) return
  const flight = sky(members.map((m) => m.flier))
  keepFlying(flight, members.map((m) => m.key))
  // those that were flying a moment ago go on from where they were; the others come in from a side
  const seen = lastSeen()
  members.forEach((m, i) => {
    dye(flight.piece(i).object, out[m.key] ?? m.own)
    if (seen[m.key]) flight.resume(i, seen[m.key])
    else setTimeout(() => flight.roam(i), 600 + i * 700)
  })
}
