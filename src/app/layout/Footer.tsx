import { experience, me } from '@/content/content'
import ExternalLink from '@/shared/ExternalLink'
import './Footer.css'

// Le pied de page, sur une ligne : le parcours (contexte, à gauche), les liens (à droite)
export default function Footer() {
  return (
    <footer className="rg-foot">
      <p className="rg-xp">
        {/* Le premier de la liste est le poste actuel */}
        Aujourd’hui chez <span>{experience[0]}</span>, avant{' '}
        {experience.slice(1).map((company, k) => (
          <span key={company}>
            {k > 0 && ' et '}
            <span>{company}</span>
          </span>
        ))}
        .
      </p>
      <p>
        <ExternalLink href={me.github}>GitHub</ExternalLink>
        <ExternalLink href={me.linkedin}>LinkedIn</ExternalLink>
      </p>
    </footer>
  )
}
