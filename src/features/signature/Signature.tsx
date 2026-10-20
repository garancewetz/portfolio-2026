import './Signature.css'

// Effets cachés, au survol (rien ne les annonce), un par mot : le e de Garance ondule comme un liquide, et
// Wetzel devient Marzal (l'autre nom de famille de Garance) avec ses propres lettres (voir morphOf).
const HIDDEN: Record<string, Record<number, string>> = { Garance: { 6: 'rg-wave' } }
const lettersOf = (word: string) =>
  [...word].map((ch, k) => {
    const effect = HIDDEN[word]?.[k]
    return effect ? (
      <span key={k} className={effect}>
        {ch}
      </span>
    ) : (
      ch
    )
  })

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
          <feDisplacementMap in="SourceGraphic" scale="22" />
        </filter>
      </svg>
    </>
  )
}
