import { useEffect, useState } from 'react'
import './Fireworks.css'

// L'interrupteur du mode feu d'artifice, au bout de la ligne du nom, à droite : un petit feu d'artifice en ASCII,
// sur une seule ligne, sans bouger de place. Au repos, une petite étoile (un point seul, on ne le verrait pas) ;
// au survol (ou au focus du clavier), elle éclate, retombe en étincelles, s'éteint et se rallume, en boucle tant
// qu'on reste dessus. Allumé, le bouquet reste ouvert.
// Comme le nom, il monte en défilant et se pose en bas de l'écran avec le dernier mot.
// on : mode allumé ; start : la hauteur de départ du dernier mot du nom (en vh).
// (Rien si l'on a demandé moins d'animations : le mode n'existe pas.)
const REST = ' -*- '
const BURST = '- * -'
const SPARKS = '.   .'
const EMBER = '  .  '
const LOOP = [REST, BURST, SPARKS, EMBER]
// (le temps de chaque dessin, au survol)
const STEP = 170

interface FireworksSwitchProps {
  on: boolean
  onToggle: () => void
  start: number
}

export default function FireworksSwitch({ on, onToggle, start }: FireworksSwitchProps) {
  const [over, setOver] = useState(false)
  const [t, setT] = useState(0)

  // au survol : un dessin après l'autre, en partant de l'étoile qui éclate
  useEffect(() => {
    if (!over) return
    const id = setInterval(() => setT((k) => k + 1), STEP)
    return () => clearInterval(id)
  }, [over])

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const enter = () => {
    setT(1)
    setOver(true)
  }
  const leave = () => setOver(false)
  const drawing = over ? LOOP[t % LOOP.length] : on ? BURST : REST
  return (
    <div className="rg-fw-place">
      {/* (pour les lecteurs d'écran, un nom fixe et l'état « enfoncé » ; à l'écran, le dessin) */}
      <button
        type="button"
        className="rg-fw-switch"
        style={{ '--o': `${start}vh` }}
        aria-label="feu d’artifice"
        aria-pressed={on}
        onClick={onToggle}
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={enter}
        onBlur={leave}
      >
        <span className="rg-fw-ascii" aria-hidden>
          {drawing}
        </span>
      </button>
    </div>
  )
}
