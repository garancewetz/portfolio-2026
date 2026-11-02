import { useEffect, useRef } from 'react'
import { BELLY, BELLY_LOW, EARS, EARS_DOWN, FEET, FLAP_FLAT, FLAP_UP, HAPPY, HEAD, LEGS } from './art'
import './HomeYeti.css'

// Le yéti de l'accueil. À l'arrivée, il tombe du haut de l'écran en volant (il bat très vite des oreilles) et se
// pose sur la dernière carte. Dès qu'on défile, il s'envole, et va se poser sur le filet au-dessus du nom, au-dessus
// de « wetzel » ; revenu tout en haut, il retourne sur sa carte. Posé, il s'accroupit un instant, puis se tient
// debout, et suit ce sur quoi il est posé.
// Sans animation (si on l'a demandé au système) : il est directement à sa place.

const FLY = [
  [FLAP_UP, HAPPY, BELLY, LEGS],
  [FLAP_FLAT, HAPPY, BELLY, LEGS],
]
const STAND = [EARS, HEAD, BELLY, FEET]
const LAND = ['', EARS_DOWN, HEAD, BELLY_LOW]
// sa vitesse en vol (pixels par seconde : au plus, au moins ; entre les deux, il ralentit en approchant) ; un
// battement d'oreilles (en secondes) ; combien de temps il reste accroupi en se posant ; à partir de combien de
// pixels défilés il quitte sa carte
const FAST = 520
const SLOW = 70
const FLAP = 0.07
const SQUAT = 0.3
const AWAY = 40

type Spot = { x: number; y: number }

// la dernière carte (le haut de sa capture), où il se pose à l'arrivée
function card(): Spot | null {
  const shots = document.querySelectorAll<HTMLElement>('.rg-card .shot')
  const shot = shots[shots.length - 1]
  if (!shot) return null
  const r = shot.getBoundingClientRect()
  return { x: r.left + r.width * 0.7, y: r.top }
}

// le filet au-dessus du nom (sur un grand écran, celui du prénom ; sur un petit, le haut de la signature), et
// « wetzel », où il se pose
function line(): Spot | null {
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
    // où il est (ses pieds), depuis quand il est posé (null : en vol), et sur quoi il vise
    let me: Spot | null = null
    let perched: number | null = null
    let goal: 'card' | 'line' = 'card'
    let shown = ''
    let last = performance.now()
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const want = scrollY > AWAY ? 'line' : 'card'
      // (il change de but : il s'envole)
      if (want !== goal) {
        goal = want
        perched = null
      }
      const at = goal === 'line' ? line() : card()
      if (!at) return
      // (à l'arrivée : juste au-dessus de l'écran, à l'aplomb de sa carte)
      if (!me) me = still ? { ...at } : { x: at.x, y: -40 }

      if (perched === null) {
        const dx = at.x - me.x
        const dy = at.y - me.y
        const d = Math.hypot(dx, dy)
        const step = Math.max(SLOW, Math.min(FAST, d * 2.5)) * dt
        if (still || d <= step) {
          me = { ...at }
          perched = now
        } else {
          me = { x: me.x + (dx / d) * step, y: me.y + (dy / d) * step }
        }
      } else {
        // posé : il suit ce qui le porte (la carte qui monte, le filet qui arrive)
        me = { ...at }
      }

      const t = now / 1000
      const pose =
        perched === null ? FLY[Math.floor(t / FLAP) % FLY.length] : now - perched < SQUAT * 1000 && !still ? LAND : STAND
      const text = pose.map((l) => l.padEnd(9)).join('\n')
      if (text !== shown) el.textContent = shown = text
      // (en vol, il flotte un peu ; posé, ses pieds, les « '' », sont en haut de leur ligne : on la descend un peu,
      // pour qu'ils touchent ce qui le porte)
      const y = perched === null ? me.y + Math.sin(t * 3) * 3 : me.y + 4
      el.style.transform = `translate(${Math.round(me.x)}px, ${Math.round(y)}px) translate(-50%, -100%)`
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <pre className="rg-yeti" ref={ref} aria-hidden />
}
