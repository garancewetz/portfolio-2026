import { useEffect, useRef } from 'react'
import { BELLY, BELLY_LOW, EARS, EARS_DOWN, FEET, FLAP_FLAT, FLAP_UP, HAPPY, HEAD, LEGS } from './art'
import './HomeYeti.css'

// Le yéti de l'accueil. À l'arrivée, il tombe du haut de l'écran en volant (il bat très vite des oreilles), tout
// doucement, jusqu'au filet au-dessus du nom, au-dessus de « wetzel », qu'on défile ou pas (sans défiler, le filet
// est plus bas que l'écran : il y descend quand même, et on l'y retrouve). Posé, il s'accroupit un instant, puis se
// tient debout, et suit le filet.
// Sans animation (si on l'a demandé au système) : il est déjà posé.

const FLY = [
  [FLAP_UP, HAPPY, BELLY, LEGS],
  [FLAP_FLAT, HAPPY, BELLY, LEGS],
]
const STAND = [EARS, HEAD, BELLY, FEET]
const LAND = ['', EARS_DOWN, HEAD, BELLY_LOW]
// sa descente, du haut de l'écran au filet (en secondes) ; un battement d'oreilles (en secondes) ; combien de temps
// il reste accroupi en se posant
const DESCENT = 9
const FLAP = 0.07
const SQUAT = 0.3

// (il part vite, plane, et ralentit pour se poser)
const ease = (t: number) => 1 - (1 - t) ** 2

// le filet au-dessus du nom (sur un grand écran, posé au-dessus de « garance » ; sur un petit, le haut de la
// signature), et « wetzel », où il se pose
function perch() {
  const first = document.querySelector<HTMLElement>(".rg-word[data-line='0']")
  const last = document.querySelector<HTMLElement>(".rg-word[data-line='1']")
  const name = document.querySelector<HTMLElement>('.rg-name')
  if (!first || !last || !name) return null
  const line = getComputedStyle(first, '::before')
  const y =
    line.content === 'none'
      ? name.getBoundingClientRect().top
      : first.getBoundingClientRect().top + parseFloat(line.top)
  const w = last.getBoundingClientRect()
  return { x: w.left + w.width * 0.55, y }
}

export default function HomeYeti() {
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const born = performance.now()
    let shown = ''
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const t = (now - born) / 1000
      const at = perch()
      if (!at) return
      const k = still ? 1 : Math.min(1, t / DESCENT)
      const landed = k >= 1
      // du haut de l'écran au filet (qui bouge si l'on défile : il le suit) ; en vol, il flotte un peu
      let y = -40 + (at.y + 40) * ease(k)
      if (!landed) y += Math.sin(t * 3) * 3
      // (posé : ses pieds, les « '' », sont en haut de leur ligne : on la descend un peu, pour qu'ils touchent le
      // filet)
      else y = at.y + 4
      const pose = landed ? (t - DESCENT < SQUAT && !still ? LAND : STAND) : FLY[Math.floor(t / FLAP) % FLY.length]
      const text = pose.map((l) => l.padEnd(9)).join('\n')
      if (text !== shown) el.textContent = shown = text
      el.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(y)}px) translate(-50%, -100%)`
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <pre className="rg-yeti" ref={ref} aria-hidden />
}
