import { useState } from 'react'
import { me, projects } from '@/content/content'
import Ripple from '@/shared/Ripple'
import ProjectCard from '@/features/projects/ProjectCard'
import ProjectSheet from '@/features/sheet/ProjectSheet'
import { useSheetRoute } from '@/features/sheet/useSheetRoute'
import Signature from '@/features/signature/Signature'
import AbandonedBand from '@/features/abandoned/AbandonedBand'
import GapMarker from '@/features/abandoned/GapMarker'
import PageGuides from './layout/PageGuides'
import ScrollHint from './layout/ScrollHint'
import Footer from './layout/Footer'
import { NAME, cardStart, fieldHeight, nameStart } from './timeline'
import { useStickyLayout } from './useStickyLayout'
import './App.css'

// La page. D'abord les projets : les cartes montent une à une et se rangent sur une ligne, une colonne par
// projet (position: sticky), sur la grille CSS en fond (colonnes, gap, rangée), comme dans les outils du
// navigateur. Ensuite la signature : le nom, en très grand. Une fois tout rangé, la page continue juste ce qu'il
// faut : la grille remonte d'un bloc, et le pied de page arrive dessous. Un clic sur une carte ouvre sa fiche.
export default function App() {
  const N = projects.length
  // la mise en place au défilement ; phase : 'scroll' (les projets montent) → 'done' (tous rangés)
  const { root, top, hint, phase } = useStickyLayout()
  const sheet = useSheetRoute(projects, root)
  const [gap, setGap] = useState(false) // easter egg : projets abandonnés affichés

  return (
    <main className={`rg is-${phase} ${gap ? 'show-ab' : ''}`} style={{ '--n': N }} ref={root}>
      {/* l'ondulation au survol des captures (seulement l'image, pas toute la carte) */}
      <Ripple root={root} item=".rg-card .shot" />

      {/* Intitulé en haut de page, visible dès l'arrivée ; les cartes se rangent juste en dessous */}
      <h1 className="rg-top" ref={top}>
        {/* le nom, seulement pour les lecteurs d'écran et les moteurs de recherche : à l'écran, c'est la
            signature, à la fin */}
        <strong className="sr">{me.name}</strong>
        <span>{me.role}</span>
        <span>Projets personnels</span>
      </h1>

      <ScrollHint ref={hint} />
      <PageGuides cols={N} />

      <section className="rg-field" aria-label="Projets" style={{ '--field-h': fieldHeight }}>
        {/* (avant les cartes : elles passent devant en montant) */}
        <AbandonedBand open={gap} />
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} start={cardStart(i)} onOpen={sheet.open} />
        ))}
        <Signature words={NAME} start={nameStart} />
      </section>

      {/* Fin de page, sous la grille, dans la page */}
      <div className="rg-end">
        <Footer />
      </div>

      <ProjectSheet projects={projects} index={sheet.sheet} cols={N} onClose={sheet.close} onStep={sheet.step} />
      <GapMarker open={gap} onToggle={() => setGap((g) => !g)} />
    </main>
  )
}
