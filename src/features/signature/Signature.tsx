import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { ANAGRAMS, MIX_DUR, MIX_STAGGER, arrange } from './anagrams'
import './Signature.css'

// Effets cachés, au survol (rien ne les annonce), un par mot : le e de Garance ondule comme un liquide, et
// Wetzel devient Marzal (l'autre nom de famille de Garance) avec ses propres lettres (voir morphOf).
const HIDDEN: Record<string, Record<number, true>> = { Garance: { 6: true } }

// L'ondulation du e : elle monte doucement puis fort au survol, et retombe tranquillement quand la souris part.
// (Un filtre SVG ne passe pas d'un état à l'autre en CSS : on fait varier sa force, image par image, seulement
// pendant ces passages.)
const WAVE_MAX = 22 // la force du filtre, à fond
const WAVE_IN = 1.2 // secondes pour monter (un frémissement tout de suite, puis fort)
const WAVE_START = 0.15 // la force dès que la souris arrive (un léger frémissement visible)
const WAVE_OUT = 1.4 // secondes pour retomber (en douceur, jusqu'au calme)
function Wave({ children }: { children: string }) {
  const el = useRef<HTMLSpanElement>(null)
  const stop = useRef<() => void>(() => {})

  // part de la force actuelle et va vers le but : montée qui frémit tout de suite puis accélère, descente adoucie
  // aux deux bouts
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
      const level = to
        ? Math.max(from, WAVE_START) + (1 - Math.max(from, WAVE_START)) * p * p
        : from * (1 - p * p * (3 - 2 * p))
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
      <span key={k} className={`rg-m ${move}`} style={{ '--k': k, '--r': word.length - 1 - k }}>
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

// Les anagrammes (voir anagrams.ts) : au changement, chaque lettre part de là où elle était et glisse jusqu'à sa
// nouvelle place, l'une après l'autre (elle change de ligne, donc de police et de taille, si elle le doit).
// Pendant ce temps, et sur une anagramme, chaque lettre est une boîte à part ; au repos sur le nom, on revient au
// texte d'origine (avec son crénage et ses effets au survol).
const MIX_EASE = 'cubic-bezier(0.5, 0, 0.2, 1)'

// où est chaque lettre, à l'écran : son bord gauche, sa ligne de base, la taille de sa police
type Places = Map<string, { x: number; base: number; fs: number }>
function measure(root: HTMLElement): Places {
  const places: Places = new Map()
  const range = document.createRange()
  for (const word of root.querySelectorAll<HTMLElement>('.rg-word')) {
    const line = word.dataset.line
    const base = word.querySelector('.rg-base')!.getBoundingClientRect().top
    const fs = parseFloat(getComputedStyle(word).fontSize)
    const boxes = word.querySelectorAll<HTMLElement>('[data-l]')
    if (boxes.length) {
      for (const el of boxes) places.set(el.dataset.l!, { x: el.getBoundingClientRect().left, base, fs })
      continue
    }
    // le nom, en texte : lettre par lettre (sans le r caché au dos du t de Wetzel)
    const walk = document.createTreeWalker(word, NodeFilter.SHOW_TEXT)
    let k = 0
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      if (node.parentElement?.closest('.rg-m-back')) continue
      for (let i = 0; i < (node.textContent ?? '').length; i++, k++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        places.set(`${line}-${k}`, { x: range.getBoundingClientRect().left, base, fs })
      }
    }
  }
  return places
}

// La signature, à la fin : le nom, sur une ligne, discret, posé en bas de l'écran comme une signature au bas
// d'une lettre (« Garance », puis « Wetzel » plus appuyé). Chaque mot a sa propre colonne (toute la hauteur du
// champ) : « Garance » arrive, puis « Wetzel » vient se poser à côté. Sa place dépend de la largeur du prénom
// (--first-w, mesurée : elle change avec les anagrammes). (Décor : le nom est le titre de la page, pour les
// lecteurs d'écran.)
// words : le prénom et le nom ; start(line) : la hauteur de départ de chaque mot (en vh) ;
// ref : de quoi afficher une anagramme (show), voir SignatureHandle.
export interface SignatureHandle {
  /** affiche l'anagramme n (0 : le nom), en faisant voyager les lettres */
  show(n: number): void
}
interface SignatureProps {
  words: string[]
  start: (line: number) => number
  ref?: Ref<SignatureHandle>
}

export default function Signature({ words, start, ref }: SignatureProps) {
  const root = useRef<HTMLDivElement>(null)
  const [mix, setMix] = useState(0)
  // les lettres sont des boîtes à part pendant le voyage (et sur une anagramme)
  const [moving, setMoving] = useState(false)
  const before = useRef<Places | null>(null)
  const run = useRef(0)

  // au changement : on note où sont les lettres, avant que la page ne change, puis on change
  useImperativeHandle(
    ref,
    () => ({
      show(n) {
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches
        if (root.current && !still) {
          before.current = measure(root.current)
          setMoving(true)
        }
        setMix(n)
      },
    }),
    [],
  )
  const letters = mix !== 0 || moving ? arrange(ANAGRAMS[mix]) : null

  // la largeur du prénom, pour placer le nom à côté : mesurée avant chaque affichage (une anagramme la change :
  // avant le voyage des lettres, pour qu'elles visent la bonne place), et quand la fenêtre change de taille
  const placeName = () => {
    const first = root.current?.querySelector<HTMLElement>('.rg-word')
    if (first) root.current!.style.setProperty('--first-w', `${first.offsetWidth}px`)
  }
  useEffect(() => {
    document.fonts.ready.then(placeName)
    addEventListener('resize', placeName)
    return () => removeEventListener('resize', placeName)
  }, [])

  // puis chaque lettre part de son ancienne place (position, taille) et rejoint la nouvelle
  useLayoutEffect(() => {
    placeName()
    const from = before.current
    before.current = null
    if (!from || !root.current) return
    const token = ++run.current
    const to = measure(root.current)
    const els = [...root.current.querySelectorAll<HTMLElement>('[data-l]')]
    const anims = els.map((el, n) => {
      el.getAnimations().forEach((a) => a.cancel())
      const id = el.dataset.l!
      const a = from.get(id)
      const b = to.get(id)!
      const box = el.getBoundingClientRect()
      el.style.transformOrigin = `0 ${b.base - box.top}px`
      const s = a ? a.fs / b.fs : 1
      const dx = a ? a.x - b.x : 0
      const dy = a ? a.base - b.base : 0
      return el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }], {
        duration: MIX_DUR,
        delay: n * MIX_STAGGER,
        easing: MIX_EASE,
        fill: 'backwards',
      })
    })
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (run.current === token) setMoving(false)
      })
      .catch(() => {}) // (relancée avant la fin : la suivante prend le relais)
  }, [mix])

  return (
    <>
      <div className="rg-name" aria-hidden ref={root}>
        {(letters ? ANAGRAMS[mix] : words).map((word, line) => (
          <div key={line} className="rg-line">
            {/* chaque mot part à sa hauteur (le nom un peu après le prénom), puis se pose à côté */}
            <span className="rg-word" data-line={line} style={{ '--o': `${start(line)}vh` }}>
              {letters
                ? letters[line].map((l) => (
                    <span key={l.id} className="rg-l" data-l={l.id}>
                      {l.ch}
                    </span>
                  ))
                : MORPHS[word]
                  ? morphOf(word)
                  : lettersOf(word)}
              {/* repère de la ligne de base (pour placer les lettres qui voyagent) */}
              <i className="rg-base" />
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
