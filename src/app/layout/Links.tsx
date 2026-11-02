import { carnet, me } from '@/content/content'
import ExternalLink from '@/shared/ExternalLink'
import './Links.css'

// Les liens, en haut à droite, en face de « hello, world. » : le labo, sur ce site, puis les liens vers ailleurs.
// (Le feu d'artifice n'est pas un lien : il est en bas, sur la ligne du nom.)
export default function Links() {
  return (
    <nav className="rg-links" aria-label="Liens">
      <a href={carnet.href}>labo →</a>
      <ExternalLink href={me.github}>GitHub</ExternalLink>
      <ExternalLink href={me.linkedin}>LinkedIn</ExternalLink>
    </nav>
  )
}
