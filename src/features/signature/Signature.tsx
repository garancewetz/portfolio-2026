import { useEffect, useRef } from 'react'
import './Signature.css'

// Effets cachés, au survol (rien ne les annonce), un par mot : le e de Garance ondule comme un liquide, et
// Wetzel devient Marzal (l'autre nom de famille de Garance) avec ses propres lettres (voir morphOf).
const HIDDEN: Record<string, Record<number, true>> = { Garance: { 6: true } }

// L'ondulation du e : elle monte doucement puis fort au survol, et retombe tranquillement quand la souris part.
// (Un filtre SVG ne passe pas d'un état à l'autre en CSS : on fait varier sa force, image par image, seulement
// pendant ces passages.)
const WAVE_MAX = 22 // la force du filtre, à fond
const WAVE_IN = 1.6 // secondes pour monter (lentement au début, puis fort)
const WAVE_OUT = 1.4 // secondes pour retomber (en douceur, jusqu'au calme)
function Wave({ children }: { children: string }) {
  const el = useRef<HTMLSpanElement>(null)
  const stop = useRef<() => void>(() => {})

  // part de la force actuelle et va vers le but : montée en accélérant, descente adoucie aux deux bouts
  const go = (to: 0 | 1) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    stop.current()
    const span = el.current
    const fe = document.getElementById('rg-wobble-force') as SVGFEDisplacementMapElement | null
    if (!span || !fe) return
    const from = fe.scale.baseVal / WAVE_MAX
    const dur = (to ? WAVE_IN : WAVE_OUT) * Math.abs(to - from)
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = dur ? Math.min(1, (now - t0) / 1000 / dur) : 1
      const eased = to ? p * p * p : p * p * (3 - 2 * p)
      const level = from + (to - from) * eased
      fe.scale.baseVal = level * WAVE_MAX
      // filtre posé seulement quand il ondule (au repos, la lettre reste nette)
      span.classList.toggle('is-on', level > 0)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    stop.current = () => cancelAnimationFrame(raf)
  }
  useEffect(() => () => stop.current(), [])

  return (
    <span ref={el} className="rg-wave" onPointerEnter={() => go(1)} onPointerLeave={() => go(0)}>
      {children}
    </span>
  )
}

const lettersOf = (word: string) => [...word].map((ch, k) => (HIDDEN[word]?.[k] ? <Wave key={k}>{ch}</Wave> : ch))

// Wetzel → Marzal, avec ses propres lettres, l'une après l'autre : le W se retourne de haut en bas (un M), les e
// et le z font un demi-tour (les e donnent ə, comme un a ; le z reste un z), le l ne bouge pas, et le t bascule
// pour montrer un r au dos (lui seul n'a pas d'équivalent)
const MORPHS: Record<string, true> = { Wetzel: true }
const MOVES: Record<string, string> = { W: 'rg-m-flip', e: 'rg-m-spin', z: 'rg-m-spin', t: 'rg-m-card' }
const morphOf = (word: string) =>
  [...word].map((ch, k) => {
    const move = MOVES[ch]
    if (!move) return ch
    return (
      <span key={k} className={`rg-m ${move}`} style={{ '--k': k }}>
        {move === 'rg-m-card' ? (
          <>
            <span className="rg-m-front">{ch}</span>
            <span className="rg-m-back">r</span>
          </>
        ) : (
          ch
        )}
      </span>
    )
  })

// La signature, à la fin : le nom en très grand, sous les cartes (« Garance » puis « Wetzel » en italique, calé à
// droite). Chaque mot a sa propre colonne (toute la hauteur du champ), où il part à sa hauteur puis se colle sur
// sa ligne. (Décor : le nom est le titre de la page, pour les lecteurs d'écran.)
// words : les mots, un par ligne ; start(line) : la hauteur de départ de chaque mot (en vh).
interface SignatureProps {
  words: string[]
  start: (line: number) => number
}

export default function Signature({ words, start }: SignatureProps) {
  return (
    <>
      <div className="rg-name" aria-hidden>
        {words.map((word, line) => (
          <div key={word} className="rg-line" style={{ '--line': line }}>
            {/* la 2e ligne se colle une ligne plus bas : elle part aussi une ligne plus bas */}
            <span className="rg-word" style={{ '--o': `calc(${start(line)}vh + ${line} * var(--lh))` }}>
              {MORPHS[word] ? morphOf(word) : lettersOf(word)}
            </span>
          </div>
        ))}
      </div>
      {/* le filtre « liquide » du e de Garance */}
      <svg className="rg-defs" aria-hidden width="0" height="0">
        <filter id="rg-wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="3">
            <animate attributeName="baseFrequency" dur="3s" values="0.015;0.04;0.015" repeatCount="indefinite" />
          </feTurbulence>
          {/* (force : 0 au repos, voir Wave) */}
          <feDisplacementMap id="rg-wobble-force" in="SourceGraphic" scale="0" />
        </filter>
      </svg>
    </>
  )
}
