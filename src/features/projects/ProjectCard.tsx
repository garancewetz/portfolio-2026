import Shot from '@/shared/Shot'
import ProjectStatus from '@/shared/ProjectStatus'
import { projectNumber } from '@/shared/projectNumber'
import type { Project } from '@/content/types'
import './ProjectCard.css'

// Un projet, dans sa colonne : la carte y part à sa hauteur (start, en vh), puis se colle en haut (position:
// sticky). Toute la carte ouvre la fiche du projet (onOpen ; les liens vers le site et le code y sont). Sans
// cadre : l'image et son titre.
interface ProjectCardProps {
  project: Project
  index: number
  /** hauteur de départ (vh) */
  start: number
  /** sa colonne (de 1 à 5) et sa ligne (0 : la première) */
  col: number
  row: number
  onOpen: (index: number) => void
}

export default function ProjectCard({ project: p, index: i, start, col, row, onOpen }: ProjectCardProps) {
  return (
    // (toutes les colonnes sur la même rangée de la grille : une carte de la seconde ligne se colle plus bas, sous
    // celle de la première)
    <div className="rg-col" style={{ '--o': `${start}vh`, '--row': row, gridColumn: col, gridRow: 1 }}>
      <div className="rg-card" data-i={i} style={{ '--k': i /* ordre sur mobile */ }}>
        {/* l'intitulé de sa section (une autre famille que les projets, sur sa propre ligne), juste au-dessus */}
        {p.section && <h2 className="rg-section">{p.section}</h2>}
        <button
          type="button"
          className="rg-link"
          aria-haspopup="dialog"
          aria-label={`${p.title} : ouvrir la fiche`}
          onClick={() => onOpen(i)}
        >
          {/* (chargée tout de suite : la carte est là dès l'arrivée, même si elle part hors de l'écran) */}
          <Shot project={p} eager />
          <span className="rg-meta">
            <span className="rg-n">{projectNumber(i)}</span>
            <span className="rg-title">{p.title}</span>
          </span>
          {/* Sur mobile seulement (sans fiche à côté) : la phrase courte et, s'il n'est pas en ligne, où il en est.
              Sur grand écran, c'est dans la fiche. */}
          <span className="rg-short">{p.short}</span>
          <ProjectStatus project={p} className="rg-status" />
        </button>
      </div>
    </div>
  )
}
