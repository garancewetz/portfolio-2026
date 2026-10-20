import { useEffect, useLayoutEffect, useRef } from 'react'
import { me } from '@/content/content'
import Shot from '@/shared/Shot'
import Ripple from '@/shared/Ripple'
import Guides from '@/shared/Guides'
import ExternalLink from '@/shared/ExternalLink'
import ProjectStatus from '@/shared/ProjectStatus'
import { projectNumber as num } from '@/shared/projectNumber'
import type { Project } from '@/content/types'
import './ProjectSheet.css'

// L'adresse d'un lien, sans « https:// » ni chemin (pour l'afficher)
const host = (url: string) => url.replace(/^https?:\/\//, '').split('/')[0]

// La fiche d'un projet (ouverte au clic sur une carte) : une page du site, en plein écran,
// sur la même grille. La capture occupe les premières colonnes, le texte les deux dernières.
// En bas, on passe au projet précédent ou suivant (aussi avec les flèches du clavier) sans revenir à la page.
// Une vraie boîte de dialogue : le focus y reste, Échap la ferme (le focus revient sur la carte : voir
// useSheetRoute).
interface ProjectSheetProps {
  projects: Project[]
  /** le projet ouvert (son index), ou null : fiche fermée */
  index: number | null
  /** nombre de colonnes de la grille */
  cols: number
  onClose: () => void
  /** -1 : projet précédent ; 1 : suivant */
  onStep: (dir: -1 | 1) => void
}

export default function ProjectSheet({ projects, index, cols, onClose, onStep }: ProjectSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const p = index === null ? null : projects[index]
  const open = p !== null

  // (avant l'affichage : la fiche est déjà ouverte quand la transition depuis la carte prend sa photo).
  // Ouverte une fois, elle reste ouverte quand on passe d'un projet à l'autre.
  useLayoutEffect(() => {
    const d = dialog.current
    if (!open || !d) return
    d.showModal()
    // la page ne défile pas derrière la fiche
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      if (d.open) d.close()
    }
  }, [open])

  // l'onglet porte le nom du projet ouvert (utile aussi quand on partage son adresse)
  const title = p?.title
  useEffect(() => {
    if (!title) return
    const page = document.title
    document.title = `${title} — ${me.name}`
    return () => {
      document.title = page
    }
  }, [title])

  if (p === null || index === null) return null
  const prev = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]
  return (
    <dialog
      ref={dialog}
      className="rg-sheet"
      aria-labelledby="rg-sheet-title"
      style={{ '--n': cols }}
      // Échap (le navigateur ferme la boîte : on suit)
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // ← → : projet précédent, suivant
      onKeyDown={(e) => {
        if (e.altKey || e.metaKey || e.ctrlKey) return
        if (e.key === 'ArrowLeft') onStep(-1)
        if (e.key === 'ArrowRight') onStep(1)
      }}
    >
      {/* l'ondulation au passage de la souris sur la capture, comme sur les cartes */}
      <Ripple root={dialog} item=".rg-sheet-shot .shot" />

      {/* les guides de la grille, comme sur la page */}
      <Guides cols={cols} className="rg-sheet-guides" />

      {/* en haut, dans le style de l'intitulé du site */}
      <div className="rg-sheet-top">
        {/* fil d'Ariane : le nom et « Projets personnels » ramènent à la page (ferment la fiche) */}
        <nav aria-label="Fil d’Ariane">
          <button type="button" onClick={onClose}>
            {me.name}
          </button>
          <button type="button" onClick={onClose}>
            Projets personnels
          </button>
          <span aria-current="page">{p.title}</span>
        </nav>
        <button type="button" className="rg-sheet-close" onClick={onClose}>
          Fermer <kbd aria-hidden>esc</kbd>
        </button>
      </div>

      <div className="rg-sheet-in">
        <div className="rg-sheet-shot">
          <Shot project={p} eager sheet />
        </div>
        <div className="rg-sheet-text">
          <p className="rg-sheet-meta">
            {/* le numéro de la carte, pour garder le fil */}
            <span>{num(index)}</span> {p.kind} · {p.year}
          </p>
          <h2 id="rg-sheet-title" className="rg-sheet-title">
            {p.title}
          </h2>
          <p className="rg-sheet-short">{p.short}</p>
          <p className="rg-sheet-long">{p.long}</p>
          {/* le site, s'il est en ligne : le lien principal, en évidence sous la description */}
          {p.demo && (
            <p className="rg-sheet-site">
              <ExternalLink href={p.demo}>{host(p.demo)}</ExternalLink>
            </p>
          )}
          <p className="rg-sheet-stack">
            <span className="sr">Technos : </span>
            {p.stack.join(' · ')}
          </p>
          <p className="rg-sheet-links">
            <ProjectStatus project={p} className="rg-sheet-status" />
            <ExternalLink href={p.code} sr="sur GitHub">
              code
            </ExternalLink>
          </p>
        </div>
      </div>

      {/* en bas, là où l'on finit de lire : le projet précédent et le suivant, par leur nom seul et une flèche
          (aussi ← → au clavier) */}
      <nav className="rg-sheet-pager" aria-label="Autres projets">
        <button type="button" onClick={() => onStep(-1)}>
          <span className="rg-pager-dir" aria-hidden>←</span>
          <span className="sr">Précédent : </span>
          <span className="rg-pager-title">
            <span>{num(projects.indexOf(prev))}</span> {prev.title}
          </span>
        </button>
        <button type="button" onClick={() => onStep(1)}>
          <span className="sr">Suivant : </span>
          <span className="rg-pager-title">
            <span>{num(projects.indexOf(next))}</span> {next.title}
          </span>
          <span className="rg-pager-dir" aria-hidden>→</span>
        </button>
      </nav>
    </dialog>
  )
}
