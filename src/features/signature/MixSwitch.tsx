import './MixSwitch.css'

// Le déclencheur des anagrammes du nom : le repère « gap » de la grille, entre les deux premières colonnes (un
// vrai bouton). Chaque clic passe à l'anagramme suivante (Carnage, Ancrage, Éclatez Wagner), puis revient au nom.
// mixed : une anagramme est affichée ; onNext : passer à la suivante.
interface MixSwitchProps {
  mixed: boolean
  onNext: () => void
}

export default function MixSwitch({ mixed, onNext }: MixSwitchProps) {
  return (
    <div className="rg-gapbox">
      <button
        type="button"
        className={`rg-gap ${mixed ? 'is-mixed' : ''}`}
        aria-label="gap (mélanger les lettres du nom)"
        onClick={onNext}
      >
        gap
      </button>
    </div>
  )
}
