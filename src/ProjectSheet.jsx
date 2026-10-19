import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { me } from './data.js'
import Shot from './Shot.jsx'

// Effet WebGL sur la capture, comme sur les cartes (seulement avec une souris)
const CardFX = lazy(() => import('./CardFX.jsx'))
const hasMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches

// L'adresse d'un lien, sans « https:// » ni chemin (pour l'afficher)
const host = (url) => url.replace(/^https?:\/\//, '').split('/')[0]

// La fiche d'un projet (ouverte au clic sur une carte) : une page du site, en plein écran,
// sur la même grille. La capture occupe les premières colonnes, le texte les deux dernières.
// Une vraie boîte de dialogue : le focus y reste, Échap la ferme ; à la fermeture, le focus revient
// sur la carte.
export default function ProjectSheet({ project: p, cols, onClose }) {
  const dialog = useRef(null)
  const [fx] = useState(hasMouse)

  // (avant l'affichage : la fiche est déjà ouverte quand la transition depuis la carte prend sa photo)
  useLayoutEffect(() => {
    const d = dialog.current
    if (!p || !d) return
    const opener = document.activeElement // la carte : le focus y revient à la fermeture
    d.showModal()
    // la page ne défile pas derrière la fiche
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      if (d.open) d.close()
      opener?.focus?.()
    }
  }, [p])

  if (!p) return null
  return (
    <dialog
      ref={dialog}
      className="rg-sheet"
      aria-labelledby="rg-sheet-title"
      style={{ '--c': p.color, '--n': cols }}
      // Échap (le navigateur ferme la boîte : on suit)
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {fx && (
        <Suspense fallback={null}>
          {/* l'ondulation au passage de la souris sur la capture, comme sur les cartes */}
          <CardFX key={p.id} root={dialog} item=".rg-sheet-shot .shot" />
        </Suspense>
      )}

      {/* les guides de la grille, comme sur la page */}
      <div className="rg-sheet-guides" aria-hidden>
        {Array.from({ length: cols }, (_, c) => (
          <span key={c} />
        ))}
      </div>

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
          Fermer <span aria-hidden>✕</span>
        </button>
      </div>

      <div className="rg-sheet-in">
        <div className="rg-sheet-shot">
          <Shot project={p} eager />
        </div>
        <div className="rg-sheet-text">
          <p className="rg-sheet-meta">
            {p.kind} · {p.year}
          </p>
          <h2 id="rg-sheet-title" className="rg-sheet-title">
            {p.title}
          </h2>
          <p className="rg-sheet-short">{p.short}</p>
          <p className="rg-sheet-long">{p.long}</p>
          <p className="rg-sheet-stack">
            <span className="sr">Technos : </span>
            {p.stack.join(' · ')}
          </p>
          <p className="rg-sheet-links">
            {p.demo ? (
              <a href={p.demo} target="_blank" rel="noreferrer">
                {host(p.demo)}
                <span className="sr"> (nouvel onglet)</span> ↗
              </a>
            ) : (
              <span className={`rg-sheet-status ${p.wip ? 'is-wip' : ''}`}>
                {p.wip ? 'en cours · bientôt en ligne' : 'pas en ligne'}
              </span>
            )}
            <a href={p.code} target="_blank" rel="noreferrer">
              code<span className="sr"> sur GitHub (nouvel onglet)</span> ↗
            </a>
          </p>
        </div>
      </div>
    </dialog>
  )
}
