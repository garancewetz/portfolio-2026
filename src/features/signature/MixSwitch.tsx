import './MixSwitch.css'

// Le déclencheur des anagrammes du nom : le point bleu de « hello, world. », en haut de la page (un vrai bouton).
// Il ne se clique qu'une fois le nom arrivé en bas (avant, il n'y aurait rien à mélanger à l'écran : c'est un
// simple point). Chaque clic passe à l'anagramme suivante (Carnage, Ancrage, Éclatez Wagner), puis revient au nom.
// mixed : une anagramme est affichée ; ready : le nom est là ; onNext : passer à la suivante.
interface MixSwitchProps {
  mixed: boolean
  ready: boolean
  onNext: () => void
}

export default function MixSwitch({ mixed, ready, onNext }: MixSwitchProps) {
  return (
    <button
      type="button"
      className={`rg-dot ${mixed ? 'is-mixed' : ''}`}
      disabled={!ready}
      aria-label="mélanger les lettres du nom"
      onClick={onNext}
    >
      .
    </button>
  )
}
