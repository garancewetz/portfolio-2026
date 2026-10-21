import './MixSwitch.css'

// Le déclencheur des anagrammes du nom : le repère « gap » de la grille, entre les deux premières colonnes (un
// vrai bouton). Comme le reste, il monte en défilant et se pose dans la rangée des cartes, au moment où le nom
// arrive (avant, il n'y aurait rien à mélanger à l'écran). Chaque clic passe à l'anagramme suivante (Carnage,
// Ancrage, Éclatez Wagner), puis revient au nom.
// mixed : une anagramme est affichée ; onNext : passer à la suivante ; start : la hauteur de départ du dernier mot
// du nom (en vh), avec lequel il se pose.
interface MixSwitchProps {
  mixed: boolean
  onNext: () => void
  start: number
}

export default function MixSwitch({ mixed, onNext, start }: MixSwitchProps) {
  return (
    <div className="rg-gapcol">
      <button
        type="button"
        className={`rg-gap ${mixed ? 'is-mixed' : ''}`}
        style={{ '--o': `${start}vh` }}
        aria-label="gap (mélanger les lettres du nom)"
        onClick={onNext}
      >
        gap
      </button>
    </div>
  )
}
