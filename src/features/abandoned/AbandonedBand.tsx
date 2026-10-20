import { abandoned } from '@/content/content'
import type { AbandonedProject } from '@/content/types'
import './Abandoned.css'

// Une entrée, écrite comme du code mis en commentaire : /* titre · année — phrase */ (TODO pour un projet en
// cours ; les /* */ sont ajoutés par le CSS)
function Comment({ a }: { a: AbandonedProject }) {
  return (
    <>
      <span className="rg-ab-title">
        {a.wip && <span className="rg-ab-todo">TODO </span>}
        {a.title}
      </span>{' '}
      · {a.year} — {a.line}
    </>
  )
}

// Easter egg : les projets abandonnés (ceux tombés dans les interstices), en bandeau qui défile juste au-dessus
// du pied de page (pause au survol et au focus ; immobile si l'on a demandé moins d'animations). Sa place est
// gardée même caché : l'ouvrir ne fait rien bouger. Les lecteurs d'écran lisent la liste une fois.
// open : affiché ou non.
export default function AbandonedBand({ open }: { open: boolean }) {
  return (
    <section id="rg-ab" className="rg-ab" aria-label="Projets abandonnés">
      <div className="rg-ab-window" tabIndex={open ? 0 : -1}>
        <ul className="rg-ab-track">
          {abandoned.map((a) => (
            <li key={a.id}>
              <Comment a={a} />
            </li>
          ))}
          {/* deuxième copie, pour que le défilement boucle sans couture */}
          {abandoned.map((a) => (
            <li key={`${a.id}-2`} aria-hidden>
              <Comment a={a} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
