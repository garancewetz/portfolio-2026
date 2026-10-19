import Guides from '@/shared/Guides'
import './Grid.css'

// La grille en fond de la page : une colonne par projet (avec « col 1 1fr »…), et la rangée où les cartes se
// collent (« row 1 »)
export default function PageGuides({ cols }: { cols: number }) {
  return (
    <Guides cols={cols} className="rg-guides" labels>
      <span className="rg-guide-row">row 1</span>
    </Guides>
  )
}
