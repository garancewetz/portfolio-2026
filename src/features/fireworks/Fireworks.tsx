import { useEffect, useMemo, useRef } from 'react'
import { MIX_LANDS } from '@/features/signature/anagrams'
import type { Fluid } from './fluid'
import type { Show } from './show'
import './Fireworks.css'

// Le mode feu d'artifice (éteint par défaut, voir FireworksSwitch) : la nuit tombe sur la page (base.css), le ciel
// apparaît (un dégradé de nuit, des étoiles), et il s'allume, sur toute la page. Deux plans, comme un vrai feu vu
// à travers des fenêtres : les gerbes lointaines (petites) éclatent derrière les cartes, les gerbes proches
// (grandes) devant. Chaque plan a ses étincelles, qui brillent (show.ts : fusées, gerbes en traits de lumière), et
// son halo de couleur liquide qui fleurit et se dissout (fluid.ts). Derrière tout, la fumée des gerbes lointaines
// s'accumule doucement au fil du spectacle (les proches n'en laissent pas : elle voilerait les captures).
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
const NEAR = 1.45 // à partir de cette taille, une gerbe est proche : elle éclate devant les cartes

interface FireworksProps {
  on: boolean
  mix: number
}

const around = (a: number, b: number) => a + Math.random() * (b - a)

// les deux plans ensemble : une gerbe, une fusée vont dans le plan qui convient à leur taille (near : forcer le
// plan proche)
interface Planes {
  burst(x: number, y: number, size: number, near?: boolean): void
  launch(x: number, y: number, size: number, trail?: number, near?: boolean): void
}

// le grand final, en deux gestes : des fusées qui montent tout autour (climb), puis des gerbes en rafale tout le
// long du nom, devant lui (crown), là où il est à l'écran ; alive : le mode est encore allumé
const climb = (show: Planes, alive: () => boolean) => {
  for (let i = 0; i < 6; i++) {
    setTimeout(
      () => alive() && show.launch(innerWidth * around(0.05, 0.95), innerHeight * around(0.06, 0.4), around(1, 1.8)),
      150 + i * 160,
    )
  }
}
// la lumière des gerbes proches sur les cartes : chaque capture à portée reçoit un reflet de la couleur de
// l'explosion, venu de son côté, d'autant plus fort qu'elle est près, et qui s'éteint avec elle (--glow, animé :
// voir Fireworks.css). (x, y) : le centre de la gerbe ; size : sa taille ; color : sa couleur
const LIGHT_REACH = 520 // px : jusqu'où porte la lumière d'une gerbe de taille 1
const LIGHT_FADE = 1600 // ms
function lightCards(x: number, y: number, size: number, color: string) {
  const reach = LIGHT_REACH * size
  for (const shot of document.querySelectorAll<HTMLElement>('.rg-card .shot')) {
    const r = shot.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) continue
    // (la distance au bord le plus proche de la capture : une gerbe qui éclate dessus l'éclaire à fond)
    const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
    const k = 1 - d / reach
    if (k < 0.05) continue
    shot.style.setProperty('--gx', `${x - r.left}px`)
    shot.style.setProperty('--gy', `${y - r.top}px`)
    // (le reflet s'éteint en traversant la capture : plus fort du côté de la gerbe)
    shot.style.setProperty('--gr', `${d + r.width * 1.1}px`)
    shot.style.setProperty('--gc', color)
    shot.animate([{ '--glow': k }, { '--glow': 0 }], { duration: LIGHT_FADE, easing: 'cubic-bezier(0.1, 0.6, 0.3, 1)' })
  }
}

const crown = (show: Planes) => {
  const words = [...document.querySelectorAll('.rg-name .rg-word')].map((w) => w.getBoundingClientRect())
  words.forEach((r, line) => {
    // (seulement si le mot est à l'écran)
    if (r.bottom < 0 || r.top > innerHeight) return
    for (let i = 0; i < 6; i++) {
      setTimeout(
        () =>
          show.burst(r.left + r.width * around(0.05, 0.95), r.top + r.height * around(0.1, 0.8), around(1.2, 2), true),
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
    let timer = 0
    // de la profondeur : des gerbes lointaines, petites, et d'autres toutes proches, immenses
    const rocket = () => {
      if (onRef.current)
        planes.current?.launch(innerWidth * around(0.04, 0.96), innerHeight * around(0.08, 0.6), around(0.5, 2.3))
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
      if (planes.current && bouquets % CROWN_EVERY === 0) {
        const s = planes.current
        climb(s, () => onRef.current)
        setTimeout(() => onRef.current && crown(s), 1100)
        timer = window.setTimeout(program, 1100 + around(REST[0], REST[1]) + 800)
        return
      }
      const n = Math.round(around(BOUQUET[0], BOUQUET[1]))
      for (let i = 0; i < n; i++) setTimeout(rocket, i * around(80, 180))
      timer = window.setTimeout(program, around(REST[0], REST[1]))
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
        shots = 2
        timer = window.setTimeout(program, 500)
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
    if (!onRef.current || !planes.current) return
    const s = planes.current
    climb(s, () => onRef.current)
    const timer = window.setTimeout(() => onRef.current && crown(s), MIX_LANDS)
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
