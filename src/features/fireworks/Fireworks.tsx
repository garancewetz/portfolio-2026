import { useEffect, useMemo, useRef } from 'react'
import { MIX_LANDS } from '@/features/signature/anagrams'
import type { Fluid } from './fluid'
import type { Show } from './show'
import { around, climb, lightCards, spread, type Planes } from './salvos'
import { starField } from './stars'
import { HALO, NEAR, SMOKE, STARS, rhythm } from './rhythm'
import './Fireworks.css'

// Le mode feu d'artifice (éteint par défaut, voir FireworksSwitch) : la nuit tombe sur la page (base.css), le ciel
// apparaît (un dégradé de nuit, des étoiles), et il s'allume, sur toute la page. Deux plans, comme un vrai feu vu
// à travers des fenêtres : les gerbes lointaines (petites) éclatent derrière les cartes, les gerbes proches
// (grandes) devant. Chaque plan a ses étincelles, qui brillent (show.ts : fusées, gerbes en traits de lumière), et
// son halo de couleur liquide qui fleurit et se dissout (fluid.ts). Derrière tout, la fumée des gerbes lointaines
// s'accumule doucement au fil du spectacle (les proches n'en laissent pas : elle voilerait les captures).
// Le rythme, comme un vrai spectacle (rhythm.ts) : des fusées seules ou par deux, puis un bouquet, puis un court
// silence, le tout réparti sur toute la page. Un clic dans le vide fait éclater une gerbe à cet endroit. À chaque anagramme (le
// repère « gap »), des fusées montent pendant que les lettres voyagent, et une salve éclate partout quand elles ont
// atterri. Au bout de SHOW ms, le bouquet final, partout, en vagues, puis la nuit calme, et le jour revient : le mode
// s'éteint de lui-même (onEnd).
// Les moteurs ne sont chargés qu'à la première mise en route. Éteint : plus de fusées, les dernières étincelles
// s'éteignent, la fumée se dissipe, puis plus rien ne tourne.
// on : mode allumé ; mix : l'anagramme affichée (à chaque changement, une salve).
// comme un vrai spectacle, il a une fin : SHOW ms après la nuit, le bouquet final, puis CALM ms de nuit calme, et le
// jour revient (on peut toujours l'éteindre avant)
const SHOW = 30000
const CALM = 4500
const LINGER = 9000 // ms pour que la fumée se dissipe, une fois tout éteint

interface FireworksProps {
  on: boolean
  mix: number
  /** le spectacle est fini (après le bouquet final) : on peut éteindre le mode */
  onEnd: () => void
}

export default function Fireworks({ on, mix, onEnd }: FireworksProps) {
  // les toiles, du fond vers l'avant : fumée, puis le plan lointain (halo, étincelles), puis, devant la page, le
  // plan proche (halo, étincelles)
  const smokeCanvas = useRef<HTMLCanvasElement>(null)
  const farHaloCanvas = useRef<HTMLCanvasElement>(null)
  const farCanvas = useRef<HTMLCanvasElement>(null)
  const nearHaloCanvas = useRef<HTMLCanvasElement>(null)
  const nearCanvas = useRef<HTMLCanvasElement>(null)
  const far = useRef<Show | null>(null)
  const near = useRef<Show | null>(null)
  const farHalo = useRef<Fluid | null>(null)
  const nearHalo = useRef<Fluid | null>(null)
  const smoke = useRef<Fluid | null>(null)
  const planes = useRef<Planes | null>(null)
  const onRef = useRef(on)
  const endRef = useRef(onEnd)
  useEffect(() => {
    endRef.current = onEnd
  }, [onEnd])
  const raf = useRef(0)
  const paf = useRef<(() => void) | null>(null) // ce qui se passe à la première explosion (la nuit tombe)
  const stars = useMemo(() => starField(STARS), [])

  // une seule boucle à la fois : relancée à l'allumage, elle s'arrête seule une fois tout éteint et dissipé
  const wake = () => {
    if (raf.current || !near.current) return
    let last = performance.now()
    let quietSince = last
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      smoke.current?.step(dt)
      farHalo.current?.step(dt)
      nearHalo.current?.step(dt)
      const flying = (far.current?.step(dt) ?? 0) + (near.current?.step(dt) ?? 0)
      if (onRef.current || flying) quietSince = now
      if (now - quietSince < LINGER) raf.current = requestAnimationFrame(frame)
      else {
        raf.current = 0
        for (const s of [far, near]) s.current?.clear()
        for (const f of [farHalo, nearHalo, smoke]) f.current?.clear()
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
    let timer = 0 // (la fin, après le bouquet final)
    let stop = () => {} // (le rythme du spectacle)
    // de la profondeur : des gerbes lointaines, petites, et d'autres toutes proches, immenses
    const rocket = () => {
      if (onRef.current)
        planes.current?.launch(innerWidth * around(0.04, 0.96), innerHeight * around(0.08, 0.6), around(0.5, 2.3))
    }
    let nightAt = 0 // (quand la nuit est tombée : le spectacle dure SHOW ms à partir de là)
    const alive = () => onRef.current
    // le bouquet final, partout : des fusées qui montent tout autour, une rafale de fusées, puis trois vagues de
    // gerbes de plus en plus denses sur tout l'écran ; puis la nuit calme, et la fin
    const finale = () => {
      const s = planes.current
      if (!s) return
      climb(s, alive)
      for (let i = 0; i < 14; i++) setTimeout(rocket, 300 + i * around(60, 130))
      setTimeout(() => spread(s, 8, alive), 1100)
      setTimeout(() => spread(s, 10, alive), 1900)
      setTimeout(() => spread(s, 14, alive), 2700)
      timer = window.setTimeout(() => alive() && endRef.current(), 2700 + 1500 + CALM)
    }

    Promise.all([import('./show'), import('./fluid')]).then(([{ createShow, COLORS }, { createFluid }]) => {
      const canvases = [smokeCanvas, farHaloCanvas, farCanvas, nearHaloCanvas, nearCanvas].map((c) => c.current)
      if (cancelled || canvases.some((c) => !c)) return
      // (sur un petit écran, un téléphone : pas de fumée, et des halos moins fins, pour rester fluide)
      const small = innerWidth < 700
      const halo = small ? { ...HALO, dye: 320 } : HALO
      if (!small) smoke.current ??= createFluid(smokeCanvas.current!, SMOKE)
      farHalo.current ??= createFluid(farHaloCanvas.current!, halo)
      nearHalo.current ??= createFluid(nearHaloCanvas.current!, halo)
      // (la première explosion : l'ouverture, voir plus bas)
      const opening = () => {
        const first = paf.current
        paf.current = null
        first?.()
      }
      far.current ??= createShow(farCanvas.current!, (x, y, size, colors) => {
        farHalo.current?.burst(x, y, size, colors)
        smoke.current?.burst(x, y, size * 1.4)
        opening()
      })
      near.current ??= createShow(nearCanvas.current!, (x, y, size, colors) => {
        nearHalo.current?.burst(x, y, size, colors)
        lightCards(x, y, size, COLORS[colors[0]])
        opening()
      })
      const f = far.current
      const n = near.current
      if (!f || !n) return
      planes.current ??= {
        burst: (x, y, size, close = size >= NEAR) => (close ? n : f).burst(x, y, size),
        launch: (x, y, size, trail, close = size >= NEAR) => (close ? n : f).launch(x, y, size, trail),
      }
      wake()
      // l'ouverture : une seule fusée monte sur le site encore clair ; quand elle éclate, PAF, la nuit tombe d'un
      // coup, et le spectacle commence
      paf.current = () => {
        html.classList.add('is-night', 'is-paf')
        setTimeout(() => html.classList.remove('is-paf'), 400)
        nightAt = performance.now()
        stop = rhythm(rocket, { after: () => performance.now() - nightAt > SHOW, then: finale })
      }
      // (en violet, la couleur de la grille : l'or se verrait à peine sur le fond clair)
      n.launch(innerWidth / 2, innerHeight * 0.36, 2, 0)
    })
    const onResize = () => {
      for (const s of [far, near]) s.current?.resize()
      for (const f of [farHalo, nearHalo, smoke]) f.current?.resize()
    }
    // un clic dans le vide (pas sur une carte, un lien, un bouton) : une gerbe à cet endroit
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button, .rg-card, dialog')) return
      // (proche : c'est le geste du visiteur)
      planes.current?.burst(e.clientX, e.clientY, 1.3, true)
    }
    addEventListener('resize', onResize)
    addEventListener('pointerdown', onDown)
    return () => {
      cancelled = true
      paf.current = null
      stop()
      clearTimeout(timer)
      removeEventListener('resize', onResize)
      removeEventListener('pointerdown', onDown)
      // (la boucle continue seule le temps que tout s'éteigne)
    }
  }, [on])

  // une anagramme : des fusées montent pendant que les lettres voyagent, puis, quand elles ont atterri, une salve
  // éclate partout
  const firstMix = useRef(true)
  useEffect(() => {
    if (firstMix.current) {
      firstMix.current = false
      return
    }
    if (!onRef.current || !planes.current) return
    const s = planes.current
    const alive = () => onRef.current
    climb(s, alive)
    const timer = window.setTimeout(() => alive() && spread(s, 7, alive), MIX_LANDS)
    return () => clearTimeout(timer)
  }, [mix])

  // (démonté : on rend la main au navigateur)
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      document.documentElement.classList.remove('is-night')
      for (const f of [farHalo, nearHalo, smoke]) {
        f.current?.destroy()
        f.current = null
      }
      far.current = near.current = planes.current = null
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
      <canvas ref={farHaloCanvas} className="rg-fw" aria-hidden />
      <canvas ref={farCanvas} className="rg-fw" aria-hidden />
      <canvas ref={nearHaloCanvas} className="rg-fw rg-fw-front" aria-hidden />
      <canvas ref={nearCanvas} className="rg-fw rg-fw-front" aria-hidden />
    </>
  )
}
