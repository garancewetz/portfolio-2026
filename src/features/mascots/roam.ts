// The freed mascots wander the whole site: the browser remembers which ones are out, and in which colour; every
// other page (the home page, the lab's pages) lets them fly over it. Three.js and the mascots are only loaded
// when one is out. They come back only from the Mascottes page.

const KEY = 'mascots-free'
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

export async function roam() {
  // (not on the Mascottes page, which frees them itself; not in an Abyme window; not for whoever asked for less motion)
  if (location.pathname.startsWith('/mascottes') || window !== window.top || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const out = freed()
  if (!Object.keys(out).length) return
  const modules = await Promise.all([import('./roster'), import('./sky'), import('./fur')]).catch(() => null)
  if (!modules) return // (offline: they will fly next time)
  const [{ ROSTER }, { sky }, { dye }] = modules
  const members = ROSTER.filter((m) => m.key in out)
  if (!members.length) return
  const flight = sky(members.map((m) => m.flier))
  members.forEach((m, i) => {
    dye(flight.piece(i).object, out[m.key] ?? m.own)
    setTimeout(() => flight.roam(i), 600 + i * 700)
  })
}
