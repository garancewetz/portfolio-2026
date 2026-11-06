import Bichromie from './Bichromie'
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
  /** sa fiche a déjà été ouverte : un point bleu après son nom */
  seen: boolean
  onOpen: (index: number) => void
}

export default function ProjectCard({ project: p, index: i, start, col, row, seen, onOpen }: ProjectCardProps) {
  return (
    // (toutes les colonnes sur la même rangée de la grille : une carte de la seconde ligne se colle plus bas, sous
    // celle de la première)
    <div className="rg-col" style={{ '--o': `${start}vh`, '--row': row, gridColumn: col, gridRow: 1 }}>
      <div className="rg-card" data-i={i} style={{ '--k': i /* ordre sur mobile */ }}>
        <button
          type="button"
          className="rg-link"
          aria-haspopup="dialog"
          aria-label={`${p.title} : ouvrir la fiche`}
          onClick={() => onOpen(i)}
        >
          {/* la capture, en bichromie (la couleur au survol) */}
          <Bichromie project={p} />
          <span className="rg-meta">
            <span className="rg-n">{projectNumber(i)}</span>
            <span className="rg-title">
              {p.title}
              {seen && <span className="rg-seen">.</span>}
            </span>
          </span>
          {/* Quelques mots sur le sujet (sur grand écran, au survol) et, sur mobile seulement, s'il n'est pas en
              ligne, où il en est (sur grand écran, c'est dans la fiche) */}
          <span className="rg-tags">
            {p.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
          <ProjectStatus project={p} className="rg-status" />
        </button>
      </div>
    </div>
  )
}
