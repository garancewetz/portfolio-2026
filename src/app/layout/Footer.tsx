import { carnet, experience, me } from '@/content/content'
import ExternalLink from '@/shared/ExternalLink'
import FireworksSwitch from '@/features/fireworks/FireworksSwitch'
import './Footer.css'

// Le pied de page, sur une ligne : le parcours (contexte, à gauche), le labo, le feu d'artifice et les liens (à
// droite).
// fireworks : le mode feu d'artifice allumé ; onFireworks : l'allumer ou l'éteindre.
interface FooterProps {
  fireworks: boolean
  onFireworks: () => void
}

export default function Footer({ fireworks, onFireworks }: FooterProps) {
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
        {/* le labo, mes expériences : une page de ce site (→, comme les liens internes de la fiche) */}
        <a href={carnet.href}>labo →</a>
        <FireworksSwitch on={fireworks} onToggle={onFireworks} />
        <ExternalLink href={me.github}>GitHub</ExternalLink>
        <ExternalLink href={me.linkedin}>LinkedIn</ExternalLink>
      </p>
    </footer>
  )
}
