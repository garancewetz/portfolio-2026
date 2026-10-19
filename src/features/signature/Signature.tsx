import './Signature.css'

// Deux effets cachés, au survol (rien ne les annonce) : les « a » de Garance deviennent creux (seulement leur
// contour), le W de Wetzel ondule comme un liquide
const HIDDEN: Record<string, Record<number, string>> = { Garance: { 1: 'rg-hollow', 3: 'rg-hollow' }, Wetzel: { 0: 'rg-wave' } }
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
              {lettersOf(word)}
            </span>
          </div>
        ))}
      </div>
      {/* le filtre « liquide » du W */}
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
