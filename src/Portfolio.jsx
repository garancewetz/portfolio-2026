import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { abandoned, experience, me, projects } from './data.js'
import Shot from './Shot.jsx'
import './Portfolio.css'

// Effet WebGL au survol des captures (seulement avec une souris)
const CardFX = lazy(() => import('./CardFX.jsx'))
const hasMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches

// Hauteur de départ de chaque projet dans la page (en vh), dans l'ordre de lecture :
// un projet tous les STEP vh, pour qu'il traverse l'écran seul avant de se coller en haut
// (position: sticky) à côté des précédents.
const FIRST = 34
// La 2e carte part juste sous le bas de l'écran : au chargement, son haut dépasse
// (on comprend qu'il y a une suite et qu'il faut faire défiler)
const SECOND = 92
const STEP = 65
const start = (i) => (i === 0 ? FIRST : SECOND + (i - 1) * STEP)

// Au survol, une carte grossit jusqu'à SPAN colonnes (sans dépasser la hauteur de l'écran)
// et montre sa description.
const SPAN = 2

// Easter egg : le repère « gap » des guides de la grille est un bouton. Un clic fait monter, en bas de
// l'écran, un bandeau qui fait défiler les projets abandonnés (ceux tombés dans les interstices), écrits
// comme du code mis en commentaire. Une entrée : /* titre · année — phrase */ (TODO pour un projet en cours).
function Comment({ a }) {
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

// Une colonne par projet, sur une ligne. En fond, la grille CSS (colonnes, gap, rangées), comme dans
// les outils du navigateur : le vide devient le plan de travail, et le rangement devient une mise en page.
export default function Portfolio() {
  const N = projects.length
  const root = useRef(null)
  const hint = useRef(null)
  // Étape : 'scroll' (les projets montent) → 'done' (rangés, la fin de page est là)
  const [phase, setPhase] = useState('scroll')
  const [gap, setGap] = useState(false) // easter egg : bandeau des projets abandonnés ouvert
  const [fx] = useState(hasMouse)

  useEffect(() => {
    let rowH = ''
    let phaseNow = ''
    const isDocked = (c) => Math.abs(c.getBoundingClientRect().top - parseFloat(getComputedStyle(c).top)) < 4
    const check = () => {
      const r = root.current
      const cards = [...r.querySelectorAll('.rg-card')]
      if (!cards.length || getComputedStyle(cards[0]).position !== 'sticky') return setPhase('done')
      // Hauteur de la rangée (place les guides et la fin de page), au repos :
      // sans la partie qui s'ouvre au survol, même pendant qu'elle se replie
      const rest = (c) => c.offsetHeight - (c.querySelector('.rg-more')?.offsetHeight || 0)
      const h = `${Math.round(Math.max(...cards.map(rest)))}px`
      // (n'écrire que si elle change : sinon toute la page recalcule ses styles à chaque scroll)
      if (h !== rowH) r.style.setProperty('--row-h', (rowH = h))
      // Chaque carte collée à sa place devient « posée » (plate) ; celles qui montent encore flottent (ombre)
      const docked = cards.map(isDocked)
      cards.forEach((c, k) => c.classList.toggle('is-docked', docked[k]))
      const p = docked.every(Boolean) ? 'done' : 'scroll'
      if (p !== phaseNow) setPhase((phaseNow = p))
      // L'indication « scroll ↓ » s'efface dès qu'on a commencé à faire défiler
      // (sur l'élément lui-même : la classe de <main> est réécrite par React à chaque étape)
      hint.current?.classList.toggle('is-off', scrollY > 40)
    }
    check()
    addEventListener('scroll', check, { passive: true })
    addEventListener('resize', check)
    return () => {
      removeEventListener('scroll', check)
      removeEventListener('resize', check)
    }
  }, [])

  return (
    <main className={`rg is-${phase} ${gap ? 'show-ab' : ''}`} style={{ '--n': N, '--span': SPAN }} ref={root}>
      {fx && (
        <Suspense fallback={null}>
          {/* L'effet ne s'active qu'au survol de l'image, pas de toute la carte */}
          <CardFX root={root} item=".rg-card .shot" />
        </Suspense>
      )}
      {/* Intitulé en haut de page, visible dès l'arrivée ; les cartes se rangent juste en dessous */}
      <h1 className="rg-top">
        <strong>{me.name}</strong>
        <span>{me.role}</span>
        <span>Projets personnels</span>
      </h1>

      {/* Indication discrète, dans le style des étiquettes de la grille */}
      <p className="rg-hint" aria-hidden ref={hint}>
        scroll ↓
      </p>

      <div className="rg-guides" aria-hidden>
        {projects.map((p, c) => (
          <span key={p.id} className="rg-guide-col">
            <span className="rg-guide-label">
              col {c + 1} <em>1fr</em>
            </span>
          </span>
        ))}
        {/* row 2 : jusqu'où une carte survolée grossit */}
        {Array.from({ length: SPAN }, (_, r) => (
          <span key={r} className="rg-guide-row" style={{ '--r': r }}>
            row {r + 1}
          </span>
        ))}
      </div>

      <section
        className="rg-field"
        aria-label="Projets"
        // assez haut pour que le dernier projet se range, puis une petite pause
        style={{ '--field-h': `${start(N - 1) + 135}vh` }}
      >
        {projects.map((p, i) => (
          <div key={p.id} className="rg-col" style={{ '--o': `${start(i)}vh` }}>
            <a
              className="rg-card"
              href={p.demo ?? p.code}
              target="_blank"
              rel="noreferrer"
              // --ci : colonne de la carte (sert à la garder dans la grille quand elle grossit)
              style={{ '--c': p.color, '--ci': i }}
            >
              <Shot project={p} />
              <span className="rg-meta">
                <span className="rg-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="rg-title">{p.title}</span>
              </span>
              {/* Phrase courte : seulement sans survol possible (mobile, tactile) */}
              <span className="rg-short">
                {p.short}
                <span className="sr"> (nouvel onglet)</span>
              </span>
              {/* Ce que la carte révèle en grossissant au survol : la phrase simple qui dit ce que c'est,
                  et, s'il n'est pas en ligne, où mène le lien */}
              <span className="rg-more">
                <span className="rg-more-inner">
                  <span className="rg-long">{p.short}</span>
                  {!p.demo && (
                    <span className={`rg-status ${p.wip ? 'is-wip' : ''}`}>
                      {p.wip ? 'en cours · bientôt en ligne' : 'pas en ligne · le lien mène au code'}
                    </span>
                  )}
                </span>
              </span>
            </a>
          </div>
        ))}
      </section>

      {/* Fin de page, quand tout est rangé : la phrase et le parcours juste sous les projets, et le contact
          en bas de l'écran */}
      <div className="rg-end">
        <section className="rg-about" aria-label="À propos">
          <p className="rg-intro">{me.intro}</p>
          <p className="rg-xp">
            {/* Le premier de la liste est le poste actuel */}
            Aujourd’hui chez <strong>{experience[0].company}</strong>, avant{' '}
            {experience.slice(1).map((x, k) => (
              <span key={x.company}>
                {k > 0 && ' et '}
                <strong>{x.company}</strong>
              </span>
            ))}
            .
          </p>
        </section>

        <footer className="rg-foot">
          <p>
            <a href={`mailto:${me.email}`}>{me.email}</a>
            <a href={me.github} target="_blank" rel="noreferrer">
              GitHub<span className="sr"> (nouvel onglet)</span> ↗
            </a>
          </p>
        </footer>
      </div>

      {/* Easter egg : les projets abandonnés, en bandeau qui défile en bas de l'écran (pause au survol et au
          focus ; immobile si l'on a demandé moins d'animations). Les lecteurs d'écran lisent la liste une fois. */}
      <section id="rg-ab" className="rg-ab" aria-label="Projets abandonnés">
        <p className="rg-ab-label" aria-hidden>
          projets abandonnés
        </p>
        <div className="rg-ab-window" tabIndex={0}>
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

      {/* Le déclencheur : le repère « gap » des guides, entre les deux premières colonnes (un vrai bouton) */}
      <div className="rg-gapbox">
        <button
          type="button"
          className="rg-gap"
          aria-expanded={gap}
          aria-controls="rg-ab"
          aria-label="gap (projets abandonnés)"
          onClick={() => setGap((g) => !g)}
        >
          gap
        </button>
      </div>
    </main>
  )
}
