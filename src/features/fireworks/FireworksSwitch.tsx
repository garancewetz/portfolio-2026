import './Fireworks.css'

// L'interrupteur du mode feu d'artifice, dans le pied de page, à côté des liens. on : mode allumé.
// (Rien si l'on a demandé moins d'animations : le mode n'existe pas.)
interface FireworksSwitchProps {
  on: boolean
  onToggle: () => void
}

export default function FireworksSwitch({ on, onToggle }: FireworksSwitchProps) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return (
    // (pour les lecteurs d'écran, un nom fixe et l'état « enfoncé » ; à l'écran, ce que fait le clic)
    <button type="button" className="rg-fw-switch" aria-label="feu d’artifice" aria-pressed={on} onClick={onToggle}>
      {/* (court : sur un téléphone, il tient sur la ligne des liens) */}
      {on ? 'éteindre' : 'feu d’artifice'}
    </button>
  )
}
