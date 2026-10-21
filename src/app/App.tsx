import { useRef, useState } from 'react'
import { me, projects } from '@/content/content'
import Ripple from '@/shared/Ripple'
import ProjectCard from '@/features/projects/ProjectCard'
import ProjectSheet from '@/features/sheet/ProjectSheet'
import { useSheetRoute } from '@/features/sheet/useSheetRoute'
import Signature, { type SignatureHandle } from '@/features/signature/Signature'
import MixSwitch from '@/features/signature/MixSwitch'
import { ANAGRAMS } from '@/features/signature/anagrams'
import Fireworks from '@/features/fireworks/Fireworks'
import PageGuides from './layout/PageGuides'
import ScrollHint from './layout/ScrollHint'
import Footer from './layout/Footer'
import { NAME, cardStart, fieldHeight, hintCol, nameStart } from './timeline'
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
  const [fireworks, setFireworks] = useState(false) // le mode feu d'artifice (éteint par défaut)
  const signature = useRef<SignatureHandle>(null)
  const [mix, setMix] = useState(0) // l'anagramme du nom affichée (0 : le nom ; l'interrupteur sur la grille)

  // le repère « gap » : l'anagramme suivante (les lettres voyagent, et le feu d'artifice le sait)
  const nextMix = () => {
    const next = (mix + 1) % ANAGRAMS.length
    signature.current?.show(next)
    setMix(next)
  }

  return (
    <main className={`rg is-${phase}`} style={{ '--n': N, '--hint-col': hintCol }} ref={root}>
      {/* l'ondulation au survol des captures (seulement l'image, pas toute la carte) */}
      <Ripple root={root} item=".rg-card .shot" />

      {/* Intitulé en haut de page, visible dès l'arrivée ; les cartes se rangent juste en dessous */}
      <h1 className="rg-top" ref={top}>
        {/* le nom, seulement pour les lecteurs d'écran et les moteurs de recherche : à l'écran, c'est la
            signature, à la fin */}
        <strong className="sr">{me.name}</strong>
        <span>Projets personnels</span>
      </h1>

      <ScrollHint ref={hint} />
      <Fireworks on={fireworks} mix={mix} onEnd={() => setFireworks(false)} />
      <PageGuides cols={N} />

      <section className="rg-field" aria-label="Projets" style={{ '--field-h': fieldHeight }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} start={cardStart(i)} onOpen={sheet.open} />
        ))}
        <Signature words={NAME} start={nameStart} ref={signature} />
        {/* (il se pose avec le dernier mot du nom : avant, il n'y a rien à mélanger) */}
        <MixSwitch mixed={mix !== 0} ready={phase === 'done'} onNext={nextMix} start={nameStart(NAME.length - 1)} />
      </section>

      {/* Fin de page, sous la grille, dans la page */}
      <div className="rg-end">
        <Footer fireworks={fireworks} onFireworks={() => setFireworks((f) => !f)} />
      </div>

      <ProjectSheet projects={projects} index={sheet.sheet} cols={N} onClose={sheet.close} onStep={sheet.step} />
    </main>
  )
}
