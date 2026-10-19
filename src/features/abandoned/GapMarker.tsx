import './Abandoned.css'

// Le déclencheur de l'easter egg : le repère « gap » de la grille, entre les deux premières colonnes (un vrai
// bouton). open : bandeau affiché ; onToggle : l'ouvrir ou le fermer.
interface GapMarkerProps {
  open: boolean
  onToggle: () => void
}

export default function GapMarker({ open, onToggle }: GapMarkerProps) {
  return (
    <div className="rg-gapbox">
      <button
        type="button"
        className="rg-gap"
        aria-expanded={open}
        aria-controls="rg-ab"
        aria-label="gap (projets abandonnés)"
        onClick={onToggle}
      >
        gap
      </button>
    </div>
  )
}
