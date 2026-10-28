import { carnet } from '@/content/content'
import './LaboLink.css'

// Le labo, sur l'accueil : un mot, « Labo », à droite sur la ligne de l'intitulé « Projets personnels », dans le
// même style ; au survol, une petite bulle apparaît au bout. Il mène au labo, le carnet des expériences, sa propre
// page.
export default function LaboLink() {
  return (
    <a className="rg-labo" href={carnet.href}>
      Labo
      <span className="rg-labo-bubble" aria-hidden>
        °
      </span>
    </a>
  )
}
