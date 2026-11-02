import { useEffect, useRef } from 'react'
import { BELLY, EARS, FEET, HEAD, TWITCH_BACK, TWITCH_FRONT } from './art'
import './HomeYeti.css'

// Le yéti de l'accueil : debout sur le filet au-dessus du nom, au-dessus de « wetzel », dès l'arrivée (il suit le
// filet quand on défile). De temps en temps, une oreille frémit : elle se baisse un instant, puis se redresse.
// Sans animation (si on l'a demandé au système) : il reste immobile.

const STAND = [EARS, HEAD, BELLY, FEET]
const TWITCH = [
  [TWITCH_BACK, HEAD, BELLY, FEET],
  [TWITCH_FRONT, HEAD, BELLY, FEET],
]
// entre deux frémissements (en secondes : au moins, au plus) ; combien de temps l'oreille reste baissée
const CALM = [2.5, 6]
const TWITCHING = 0.22

// le filet au-dessus du nom (sur un grand écran, celui du prénom ; sur un petit, le haut de la signature), et
// « wetzel », où il se tient
function line() {
  const first = document.querySelector<HTMLElement>(".rg-word[data-line='0']")
  const last = document.querySelector<HTMLElement>(".rg-word[data-line='1']")
  const name = document.querySelector<HTMLElement>('.rg-name')
  if (!first || !last || !name) return null
  const rule = getComputedStyle(first, '::before')
  const y =
    rule.content === 'none'
      ? name.getBoundingClientRect().top
      : first.getBoundingClientRect().top + parseFloat(rule.top)
  const w = last.getBoundingClientRect()
  return { x: w.left + w.width * 0.55, y }
}

export default function HomeYeti() {
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const calm = () => CALM[0] + Math.random() * (CALM[1] - CALM[0])
    // le prochain frémissement (en secondes), le début de celui en cours (null : aucun), et quelle oreille
    let next = performance.now() / 1000 + calm()
    let twitch: number | null = null
    let ear = 0
    let shown = ''
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const at = line()
      if (!at) return
      const t = now / 1000
      // (il commence à l'image où il arrive, et dure son temps : on le voit même si les images se font rares)
      if (twitch === null && t > next && !still) {
        twitch = t
        ear = Math.random() < 0.5 ? 0 : 1
      } else if (twitch !== null && t > twitch + TWITCHING) {
        twitch = null
        next = t + calm()
      }
      const pose = twitch === null ? STAND : TWITCH[ear]
      const text = pose.map((l) => l.padEnd(9)).join('\n')
      if (text !== shown) el.textContent = shown = text
      // (ses pieds, les « '' », sont en haut de leur ligne : on la descend un peu, pour qu'ils touchent le filet)
      el.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y + 4)}px) translate(-50%, -100%)`
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <pre className="rg-yeti" ref={ref} aria-hidden />
}
