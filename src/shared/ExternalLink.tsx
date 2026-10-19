// Un lien qui s'ouvre dans un nouvel onglet : la flèche ↗ le montre à l'écran, « (nouvel onglet) » le dit aux
// lecteurs d'écran. (sr : ce qui suit le texte, seulement pour eux, ex. « sur GitHub »)
import type { ReactNode } from 'react'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  /** pour les lecteurs d'écran seulement, après le texte (ex. « sur GitHub ») */
  sr?: string
}

export default function ExternalLink({ href, children, sr = '' }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="sr">{`${sr ? ` ${sr}` : ''} (nouvel onglet)`}</span>
      {' ↗'}
    </a>
  )
}
