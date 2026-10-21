import { useEffect, useMemo, useRef } from 'react'
import { MIX_LANDS } from '@/features/signature/anagrams'
import type { Fluid } from './fluid'
import type { Show } from './show'
import './Fireworks.css'

// Le mode feu d'artifice (éteint par défaut, voir FireworksSwitch) : la nuit tombe sur la page (base.css), le ciel
// apparaît (un dégradé de nuit, des étoiles), et il s'allume, sur toute la page. Les couches, du fond vers l'avant :
// le ciel ; la fumée, qui s'accumule doucement au fil du spectacle ; à chaque explosion, un halo de couleur liquide
// qui fleurit et se dissout (fluid.ts) ; puis la page ; et devant tout (cartes et nom compris), les étincelles, qui
// brillent (show.ts : fusées, gerbes en traits de lumière).
// Le rythme, comme un vrai spectacle : des fusées seules ou par deux, puis un bouquet, puis un court silence. Un
// clic dans le vide fait éclater une gerbe à cet endroit. De temps en temps, un bouquet devient un grand final
// autour du nom. À chaque anagramme (le repère « gap »), des fusées
// montent pendant que les lettres voyagent, et le grand final éclate tout le long du nom quand elles ont atterri.
// Les moteurs ne sont chargés qu'à la première mise en route. Éteint : plus de fusées, les dernières étincelles
// s'éteignent, la fumée se dissipe, puis plus rien ne tourne.
// on : mode allumé ; mix : l'anagramme affichée (à chaque changement, le grand final).
const SOLO = [650, 1300] // ms entre deux tirs (une ou deux fusées)
const BOUQUET = [6, 10] // fusées dans un bouquet
const REST = [1200, 1800] // ms de silence après un bouquet
const CROWN_EVERY = 3 // un bouquet sur trois est un grand final autour du nom, comme pour une anagramme
const LINGER = 9000 // ms pour que la fumée se dissipe, une fois tout éteint
// le halo liquide : peu de couleur, qui se dissout vite, sans tourbillons (une lueur, pas des marbrures)
const HALO = { ink: 0.09, fade: 1.6, curl: 5 }
// la fumée : gris-bleu, très légère, qui se dissipe lentement (elle s'accumule) en tournoyant un peu
const SMOKE = { ink: 0.014, tint: [0.62, 0.64, 0.78], fade: 0.3, curl: 4 }
const STARS = 170

interface FireworksProps {
  on: boolean
  mix: number
}

const around = (a: number, b: number) => a + Math.random() * (b - a)

// le grand final, en deux gestes : des fusées qui montent tout autour (climb), puis des gerbes en rafale tout le
// long du nom (crown), là où il est à l'écran ; alive : le mode est encore allumé
const climb = (show: Show, alive: () => boolean) => {
  for (let i = 0; i < 6; i++) {
    setTimeout(
      () => alive() && show.launch(innerWidth * around(0.05, 0.95), innerHeight * around(0.06, 0.4), around(1, 1.8)),
      150 + i * 160,
    )
  }
}
const crown = (show: Show) => {
  const words = [...document.querySelectorAll('.rg-name .rg-word')].map((w) => w.getBoundingClientRect())
  words.forEach((r, line) => {
    // (seulement si le mot est à l'écran)
    if (r.bottom < 0 || r.top > innerHeight) return
    for (let i = 0; i < 6; i++) {
      setTimeout(
        () => show.burst(r.left + r.width * around(0.05, 0.95), r.top + r.height * around(0.1, 0.8), around(1.2, 2)),
        line * 160 + i * around(60, 140),
      )
    }
  })
}

// les étoiles : des points (une ombre portée chacune), plus nombreux en haut du ciel ; deux groupes, qui
// scintillent chacun à son rythme
function starField(n: number): [string, string] {
  const one = () => {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() ** 1.6 * 100).toFixed(2)
    const a = around(0.25, 0.9).toFixed(2)
    return `${x}vw ${y}vh 0 ${Math.random() < 0.12 ? 1 : 0}px rgb(238 234 226 / ${a})`
  }
  const list = Array.from({ length: n }, one)
  return [list.filter((_, i) => i % 2).join(','), list.filter((_, i) => !(i % 2)).join(',')]
}

export default function Fireworks({ on, mix }: FireworksProps) {
  const sparksCanvas = useRef<HTMLCanvasElement>(null)
  const haloCanvas = useRef<HTMLCanvasElement>(null)
  const smokeCanvas = useRef<HTMLCanvasElement>(null)
  const show = useRef<Show | null>(null)
  const halo = useRef<Fluid | null>(null)
  const smoke = useRef<Fluid | null>(null)
  const onRef = useRef(on)
  const raf = useRef(0)
  const paf = useRef<(() => void) | null>(null) // ce qui se passe à la première explosion (la nuit tombe)
  const stars = useMemo(() => starField(STARS), [])

  // une seule boucle à la fois : relancée à l'allumage, elle s'arrête seule une fois tout éteint et dissipé
  const wake = () => {
    if (raf.current || !show.current) return
    let last = performance.now()
    let quietSince = last
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      smoke.current?.step(dt)
      halo.current?.step(dt)
      const flying = show.current?.step(dt) ?? 0
      if (onRef.current || flying) quietSince = now
      if (now - quietSince < LINGER) raf.current = requestAnimationFrame(frame)
      else {
        raf.current = 0
        show.current?.clear()
        halo.current?.clear()
        smoke.current?.clear()
      }
    }
    raf.current = requestAnimationFrame(frame)
  }

  // le spectacle, les clics dans le vide
  useEffect(() => {
    onRef.current = on
    const html = document.documentElement
    // éteint : le jour revient, doucement
    if (!on) {
      html.classList.remove('is-night')
      return
    }
    let cancelled = false
    let timer = 0
    // de la profondeur : des gerbes lointaines, petites, et d'autres toutes proches, immenses
    const rocket = () => {
      if (onRef.current)
        show.current?.launch(innerWidth * around(0.04, 0.96), innerHeight * around(0.08, 0.6), around(0.5, 2.3))
    }
    let shots = 0
    // (le 2e bouquet est déjà un grand final autour du nom)
    let bouquets = CROWN_EVERY - 2
    const program = () => {
      if (shots > 0) {
        // une fusée, parfois deux à la fois
        shots--
        rocket()
        if (Math.random() < 0.4) setTimeout(rocket, around(80, 240))
        timer = window.setTimeout(program, around(SOLO[0], SOLO[1]))
        return
      }
      // le bouquet (ou, de temps en temps, le grand final autour du nom), puis le silence, puis à nouveau
      // quelques tirs
      shots = 3 + Math.floor(Math.random() * 3)
      bouquets++
      if (show.current && bouquets % CROWN_EVERY === 0) {
        const s = show.current
        climb(s, () => onRef.current)
        setTimeout(() => onRef.current && crown(s), 1100)
        timer = window.setTimeout(program, 1100 + around(REST[0], REST[1]) + 800)
        return
      }
      const n = Math.round(around(BOUQUET[0], BOUQUET[1]))
      for (let i = 0; i < n; i++) setTimeout(rocket, i * around(80, 180))
      timer = window.setTimeout(program, around(REST[0], REST[1]))
    }

    Promise.all([import('./show'), import('./fluid')]).then(([{ createShow }, { createFluid }]) => {
      if (cancelled || !sparksCanvas.current || !haloCanvas.current || !smokeCanvas.current) return
      // (sur un petit écran, un téléphone : pas de fumée, et un halo moins fin, pour rester fluide)
      const small = innerWidth < 700
      if (!small) smoke.current ??= createFluid(smokeCanvas.current, SMOKE)
      halo.current ??= createFluid(haloCanvas.current, small ? { ...HALO, dye: 320 } : HALO)
      show.current ??= createShow(sparksCanvas.current, (x, y, size, colors) => {
        halo.current?.burst(x, y, size, colors)
        smoke.current?.burst(x, y, size * 1.4)
        // (la première explosion : l'ouverture, voir plus bas)
        const first = paf.current
        paf.current = null
        first?.()
      })
      if (!show.current) return
      wake()
      // l'ouverture : une seule fusée monte sur le site encore clair ; quand elle éclate, PAF, la nuit tombe d'un
      // coup, et le spectacle commence
      paf.current = () => {
        html.classList.add('is-night', 'is-paf')
        setTimeout(() => html.classList.remove('is-paf'), 400)
        shots = 2
        timer = window.setTimeout(program, 500)
      }
      // (en violet, la couleur de la grille : l'or se verrait à peine sur le fond clair)
      show.current.launch(innerWidth / 2, innerHeight * 0.36, 2, 0)
    })
    const onResize = () => {
      show.current?.resize()
      halo.current?.resize()
      smoke.current?.resize()
    }
    // un clic dans le vide (pas sur une carte, un lien, un bouton) : une gerbe à cet endroit
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button, .rg-card, dialog')) return
      show.current?.burst(e.clientX, e.clientY, 1.3)
    }
    addEventListener('resize', onResize)
    addEventListener('pointerdown', onDown)
    return () => {
      cancelled = true
      paf.current = null
      clearTimeout(timer)
      removeEventListener('resize', onResize)
      removeEventListener('pointerdown', onDown)
      // (la boucle continue seule le temps que tout s'éteigne)
    }
  }, [on])

  // une anagramme : des fusées montent pendant que les lettres voyagent, puis, quand elles ont atterri, le grand
  // final éclate en rafale tout le long du nom
  const firstMix = useRef(true)
  useEffect(() => {
    if (firstMix.current) {
      firstMix.current = false
      return
    }
    if (!onRef.current || !show.current) return
    const s = show.current
    climb(s, () => onRef.current)
    const timer = window.setTimeout(() => onRef.current && crown(s), MIX_LANDS)
    return () => clearTimeout(timer)
  }, [mix])

  // (démonté : on rend la main au navigateur)
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      document.documentElement.classList.remove('is-night')
      halo.current?.destroy()
      smoke.current?.destroy()
      halo.current = smoke.current = null
      show.current = null
    },
    [],
  )

  return (
    <>
      <div className="rg-sky" aria-hidden>
        <i style={{ boxShadow: stars[0] }} />
        <i style={{ boxShadow: stars[1] }} />
      </div>
      <canvas ref={smokeCanvas} className="rg-fw" aria-hidden />
      <canvas ref={haloCanvas} className="rg-fw" aria-hidden />
      <canvas ref={sparksCanvas} className="rg-fw rg-fw-front" aria-hidden />
    </>
  )
}
