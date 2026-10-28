import { useEffect, useLayoutEffect, useRef } from 'react'
import { me } from '@/content/content'
import Shot from '@/shared/Shot'
import Ripple from '@/shared/Ripple'
import Guides from '@/shared/Guides'
import ExternalLink from '@/shared/ExternalLink'
import ProjectStatus from '@/shared/ProjectStatus'
import { projectNumber as num } from '@/shared/projectNumber'
import type { Project } from '@/content/types'
import Flipbook from './Flipbook'
import './ProjectSheet.css'
import './SheetBody.css'
import './SheetPager.css'

// L'adresse d'un lien, sans « https:// » ni chemin (pour l'afficher)
// Le domaine du lien ; pour une page de ce site (le jeu sous /journey, ou un lien relatif),
// le chemin aussi
const host = (url: string) => {
  if (url.startsWith('/')) return `garancewetz.dev${url.replace(/\/$/, '')}`
  const [domain, ...path] = url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .split('/')
  return domain === 'garancewetz.dev' && path.length ? `${domain}/${path.join('/')}` : domain
}

// Un lien vers une page de ce site (le CV : garancewetz.dev/journey) : il s'ouvre dans
// le même onglet, avec une flèche → ; un autre site s'ouvre dans un nouvel onglet, avec la flèche ↗ (voir
// ExternalLink)
const inside = (url: string) => url.startsWith('/') || /^https?:\/\/garancewetz\.dev\//.test(url)

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
    // le focus sur la fiche elle-même, pas sur son premier lien (sinon, en arrivant par l'adresse d'un projet, ce
    // lien s'entoure du cadre du clavier) : Tab mène ensuite aux liens, dans l'ordre
    d.focus()
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
      tabIndex={-1}
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
          {/* la capture mène au site (s'il est en ligne), comme le lien sous la description */}
          {p.demo && inside(p.demo) ? (
            <a href={p.demo} aria-label={`${p.title} : ouvrir`}>
              <Shot project={p} eager sheet />
            </a>
          ) : p.demo ? (
            <a href={p.demo} target="_blank" rel="noreferrer" aria-label={`${p.title} : voir le site (nouvel onglet)`}>
              <Shot project={p} eager sheet />
            </a>
          ) : (
            <Shot project={p} eager sheet />
          )}
        </div>
        <div className="rg-sheet-text">
          <h2 id="rg-sheet-title" className="rg-sheet-title">
            {/* le numéro de la carte, pour garder le fil */}
            <span className="rg-sheet-num">{num(index)}</span> {p.title}
          </h2>
          <p className="rg-sheet-short">{p.short}</p>
          {/* le site, s'il est en ligne : le lien principal, en évidence sous la description */}
          {p.demo && (
            <p className="rg-sheet-site">
              {inside(p.demo) ? (
                <a href={p.demo}>{host(p.demo)} →</a>
              ) : (
                <ExternalLink href={p.demo}>{host(p.demo)}</ExternalLink>
              )}
            </p>
          )}
          {/* Totoro et un oiseau, debout sur le filet de la fiche technique */}
          <Flipbook page={index} pages={projects.length} />
          {/* en bas, au niveau du bord bas de la capture : la fiche technique, qu'on consulte (chaque information
              avec son étiquette) */}
          <dl className="rg-sheet-facts">
            <div>
              <dt>Type</dt>
              <dd>{p.kind}</dd>
            </div>
            <div>
              <dt>Technos</dt>
              <dd>{p.stack.join(' · ')}</dd>
            </div>
            {!p.demo && (
              <div>
                <dt>Statut</dt>
                <dd>
                  <ProjectStatus project={p} className="rg-sheet-status" />
                </dd>
              </div>
            )}
            <div>
              <dt>Code</dt>
              <dd>
                <ExternalLink href={p.code} sr="sur GitHub">
                  GitHub
                </ExternalLink>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* en bas, là où l'on finit de lire : le projet précédent et le suivant, par leur nom seul et une flèche
          (aussi ← → au clavier) */}
      <nav className="rg-sheet-pager" aria-label="Autres projets">
        <button type="button" onClick={() => onStep(-1)}>
          <span className="rg-pager-dir" aria-hidden>
            ←
          </span>
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
          <span className="rg-pager-dir" aria-hidden>
            →
          </span>
        </button>
      </nav>
    </dialog>
  )
}
