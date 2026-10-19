import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { abandoned, experience, me, projects } from './data.js'
import Shot from './Shot.jsx'
import ProjectSheet from './ProjectSheet.jsx'
import './Portfolio.css'

// Effet WebGL au survol des captures (seulement avec une souris)
const CardFX = lazy(() => import('./CardFX.jsx'))
const hasMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches

// Hauteur de départ de chaque projet dans la page (en vh), dans l'ordre de lecture : un projet tous les
// STEP vh, pour qu'il traverse l'écran seul avant de se coller à sa place (position: sticky). La 2e carte part
// juste sous le bas de l'écran : au chargement, son haut dépasse (on comprend qu'il faut faire défiler).
const FIRST = 30
const SECOND = 84
const STEP = 44
const start = (i) => (i === 0 ? FIRST : SECOND + (i - 1) * STEP)

// Puis la signature : le nom, en très grand, sous la rangée de cartes. « Garance » (en linéale) NAME_GAP vh
// après la dernière carte, puis « Wetzel » (en italique, calé à droite) NAME_STEP vh plus loin. Le nom n'est
// pas écrit en haut de la page (seulement le métier) : la signature, à la fin, est la révélation.
const NAME = ['Garance', 'Wetzel']
const NAME_GAP = 60
const NAME_STEP = 40

// Passage de la carte à sa fiche (et retour) : la capture de la carte glisse et s'agrandit jusqu'à sa place
// dans la fiche, le reste apparaît en fondu (View Transitions). Sans elles, ou si l'on a demandé moins
// d'animations : la fiche apparaît simplement en fondu.
function morph(shot, update, opening) {
  if (!document.startViewTransition || !shot || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return update()
  const html = document.documentElement
  html.classList.add('is-morph')
  // un seul élément porte le nom à la fois : la capture de la carte avant, celle de la fiche après (et l'inverse)
  if (opening) shot.style.viewTransitionName = 'rg-shot'
  const t = document.startViewTransition(async () => {
    if (opening) shot.style.viewTransitionName = ''
    flushSync(update)
    if (!opening) shot.style.viewTransitionName = 'rg-shot'
    // (l'image de la fiche, déjà chargée par la carte, est prête avant la photo d'arrivée)
    else await document.querySelector('.rg-sheet-shot img')?.decode().catch(() => {})
  })
  t.finished.finally(() => {
    shot.style.viewTransitionName = ''
    html.classList.remove('is-morph')
  })
}

// Easter egg : les projets abandonnés, écrits comme du code mis en commentaire.
// Une entrée : /* titre · année — phrase */ (TODO pour un projet en cours).
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

// Les projets montent un par un et se rangent sur une ligne, une colonne par projet (position: sticky), puis
// les lettres du nom. En fond, la grille CSS (colonnes, gap, rangée), comme dans les outils du navigateur :
// le vide devient le plan de travail, et le rangement devient une mise en page. Une fois tout rangé, la page
// continue juste ce qu'il faut : la grille remonte d'un bloc, et le pied de page arrive dessous.
export default function Portfolio() {
  const N = projects.length
  // départ de chaque mot du nom (en vh)
  const nameStart = (line) => start(N - 1) + NAME_GAP + line * NAME_STEP
  const root = useRef(null)
  const hint = useRef(null)
  const top = useRef(null)
  // Étape : 'scroll' (les projets montent) → 'done' (tous rangés)
  const [phase, setPhase] = useState('scroll')
  const [gap, setGap] = useState(false) // easter egg : projets abandonnés affichés
  const [sheet, setSheet] = useState(null) // fiche ouverte (index du projet), ou null
  const [fx] = useState(hasMouse)
  // la capture de la carte d'un projet (point de départ et d'arrivée de la transition vers sa fiche)
  const shotOf = (i) => root.current?.querySelector(`.rg-card[data-i="${i}"] .shot`)
  const openSheet = (i) => morph(shotOf(i), () => setSheet(i), true)
  const closeSheet = () => morph(shotOf(sheet), () => setSheet(null), false)

  useEffect(() => {
    let rowH = ''
    let phaseNow = ''
    let liftNow = 0
    // Rangée : arrivée à sa place collée… ou déjà au-dessus (quand, à la fin, la grille remonte d'un bloc)
    const isDocked = (c) => c.getBoundingClientRect().top - parseFloat(getComputedStyle(c).top) < 4
    const check = () => {
      const r = root.current
      const cards = [...r.querySelectorAll('.rg-card')]
      if (!cards.length || getComputedStyle(cards[0]).position !== 'sticky') return setPhase('done')
      // Hauteur de la rangée de cartes (place les lettres du nom, le guide « row 1 » et la fin de page)
      const h = `${Math.round(Math.max(...cards.map((c) => c.offsetHeight)))}px`
      // (n'écrire que si elle change : sinon toute la page recalcule ses styles à chaque scroll)
      if (h !== rowH) r.style.setProperty('--row-h', (rowH = h))
      // Chaque carte rangée devient « posée » (plate) ; celles qui montent encore flottent (ombre)
      const docked = cards.map(isDocked)
      cards.forEach((c, k) => c.classList.toggle('is-docked', docked[k]))
      const p = docked.every(Boolean) ? 'done' : 'scroll'
      if (p !== phaseNow) setPhase((phaseNow = p))
      // À la fin, si la grille remonte (écran pas assez haut), l'intitulé remonte avec elle
      const lift = Math.max(0, Math.round(parseFloat(getComputedStyle(cards[0]).top) - cards[0].getBoundingClientRect().top))
      if (lift !== liftNow && top.current) {
        liftNow = lift
        top.current.style.transform = lift ? `translateY(${-lift}px)` : ''
      }
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

  // Easter egg : un clic sur le repère « gap » fait défiler les projets abandonnés (ceux tombés dans les
  // interstices) dans l'interstice entre les cartes et le nom : rien ne bouge dans la page.
  const toggleGap = () => setGap((g) => !g)

  // Les projets abandonnés, en bandeau qui défile dans l'interstice (pause au survol et au focus ; immobile si
  // l'on a demandé moins d'animations). Les lecteurs d'écran lisent la liste une fois.
  const band = (
    <section id="rg-ab" className="rg-ab" aria-label="Projets abandonnés">
      <div className="rg-ab-window" tabIndex={gap ? 0 : -1}>
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

  return (
    <main
      className={`rg is-${phase} ${gap ? 'show-ab' : ''}`}
      style={{ '--n': N }}
      ref={root}
    >
      {fx && (
        <Suspense fallback={null}>
          {/* L'effet ne s'active qu'au survol de l'image, pas de toute la carte */}
          <CardFX root={root} item=".rg-card .shot" />
        </Suspense>
      )}
      {/* Intitulé en haut de page, visible dès l'arrivée ; les cartes se rangent juste en dessous */}
      <h1 className="rg-top" ref={top}>
        {/* le nom, seulement pour les lecteurs d'écran et les moteurs de recherche : à l'écran, c'est la
            signature, à la fin */}
        <strong className="sr">{me.name}</strong>
        <span>{me.role}</span>
        <span>Projets personnels</span>
      </h1>

      {/* Indication discrète, dans le style des étiquettes de la grille */}
      <p className="rg-hint" aria-hidden ref={hint}>
        scroll ↓
      </p>

      <div className="rg-guides" aria-hidden>
        {projects.map((_, c) => (
          <span key={c} className="rg-guide-col">
            <span className="rg-guide-label">
              col {c + 1} <em>1fr</em>
            </span>
          </span>
        ))}
        {/* la rangée où les cartes se collent */}
        <span className="rg-guide-row">row 1</span>
      </div>

      <section
        className="rg-field"
        aria-label="Projets"
        // assez haut pour que la dernière lettre du nom se range, puis une pause courte avant la fin de page
        // (plus longue, on ferait défiler un écran entier où rien ne bouge)
        style={{ '--field-h': `calc(${nameStart(NAME.length - 1) + 20}vh + 2 * var(--lh))` }}
      >
        {/* L'interstice entre les cartes et le nom (sa propre colonne, toute la hauteur du champ : il reste à sa
            place, collé comme les cartes) : l'easter egg y fait défiler les projets abandonnés. (Avant les
            cartes : elles passent devant en montant.) */}
        <div className="rg-abcol">{band}</div>

        {projects.map((p, i) => (
          // une colonne par projet : la carte y part à sa hauteur, puis se colle en haut
          <div key={p.id} className="rg-col" style={{ '--o': `${start(i)}vh` }}>
            {/* La carte : toute la carte ouvre la fiche du projet (les liens vers le site et le code y sont) */}
            <div className="rg-card" data-i={i} style={{ '--c': p.color, '--k': i /* ordre sur mobile */ }}>
              <button
                type="button"
                className="rg-link"
                aria-haspopup="dialog"
                aria-label={`${p.title} : ouvrir la fiche`}
                onClick={() => openSheet(i)}
              >
                <Shot project={p} />
                <span className="rg-meta">
                  <span className="rg-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rg-title">{p.title}</span>
                </span>
                {/* Sur mobile seulement (sans fiche à côté) : la phrase courte et, s'il n'est pas en ligne,
                    où il en est. Sur grand écran, c'est dans la fiche. */}
                <span className="rg-short">{p.short}</span>
                {!p.demo && (
                  <span className={`rg-status ${p.wip ? 'is-wip' : ''}`}>
                    {p.wip ? 'en cours · bientôt en ligne' : 'pas en ligne'}
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}


        {/* La signature : chaque mot a sa propre colonne (toute la hauteur du champ), où il part à sa hauteur
            puis se colle sur sa ligne, sous les cartes. (Décor : le nom est le titre de la page.) */}
        <div className="rg-name" aria-hidden>
          {NAME.map((word, line) => (
            <div key={word} className="rg-line" style={{ '--line': line }}>
              {/* la 2e ligne se colle une ligne plus bas : elle part aussi une ligne plus bas */}
              <span className="rg-word" style={{ '--o': `calc(${nameStart(line)}vh + ${line} * var(--lh))` }}>
                {word}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Fin de page, sous la grille, dans la page : le pied de page */}
      <div className="rg-end">

        {/* Pied de page sur une ligne : le parcours (contexte, à gauche), le contact (à droite) */}
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
            <a href={`mailto:${me.email}`}>{me.email}</a>
            <a href={me.github} target="_blank" rel="noreferrer">
              GitHub<span className="sr"> (nouvel onglet)</span> ↗
            </a>
            <a href={me.linkedin} target="_blank" rel="noreferrer">
              LinkedIn<span className="sr"> (nouvel onglet)</span> ↗
            </a>
          </p>
        </footer>
      </div>

      {/* La fiche d'un projet, en grand au milieu (clic sur une carte) */}
      <ProjectSheet project={sheet === null ? null : projects[sheet]} cols={N} onClose={closeSheet} />


      {/* Le déclencheur : le repère « gap » des guides, entre les deux premières colonnes (un vrai bouton) */}
      <div className="rg-gapbox">
        <button
          type="button"
          className="rg-gap"
          aria-expanded={gap}
          aria-controls="rg-ab"
          aria-label="gap (projets abandonnés)"
          onClick={toggleGap}
        >
          gap
        </button>
      </div>
    </main>
  )
}
