import type { Project } from '@/content/types'
import './Shot.css'

// Capture d'un projet (ou un encart « capture à venir » s'il n'y en a pas encore) ; dans la fiche, avec un écran
// de téléphone à côté (site pensé pour le téléphone). L'élément du dehors (.shot-frame) est celui qui glisse de
// la carte à la fiche.
// (des span : la capture est aussi dans le bouton de la carte)

interface ShotProps {
  project: Project
  /** chargée tout de suite (dans la fiche) plutôt qu'à l'approche du scroll */
  eager?: boolean
  /** dans la fiche : avec son écran de téléphone à côté, s'il en a un */
  sheet?: boolean
}

export default function Shot({ project, eager = false, sheet = false }: ShotProps) {
  // dans la fiche, site pensé pour le téléphone : un écran de téléphone et la capture, côte à côte (chacun une
  // capture à part : l'ondulation se pose sur l'un ou l'autre)
  if (sheet && project.phone && project.image) {
    return (
      <span className="with-phone shot-frame">
        <span className="shot is-desktop">
          <img
            src={project.image}
            alt={project.alt}
            width="1200"
            height="750"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
        <span className="shot is-phone">
          <img
            src={project.phone.src}
            alt={project.phone.alt}
            width="640"
            height="1385"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
      </span>
    )
  }
  if (!project.image) {
    return (
      <span className="shot shot-frame shot-empty" role="img" aria-label={`Capture de ${project.title} à venir`}>
        <span>{project.title}</span>
        <small>capture à venir</small>
      </span>
    )
  }
  return (
    <span className="shot shot-frame">
      {/* dimensions indicatives (format 16/10) : la place est réservée avant le chargement */}
      <img src={project.image} alt={project.alt} width="1200" height="750" loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </span>
  )
}
