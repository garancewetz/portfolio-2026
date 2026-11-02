import { useRef, useState } from 'react'
import { me, projects } from '@/content/content'
import Ripple from '@/shared/Ripple'
import ProjectCard from '@/features/projects/ProjectCard'
import ProjectSheet from '@/features/sheet/ProjectSheet'
import { useSheetRoute } from '@/features/sheet/useSheetRoute'
import { useSeen } from '@/features/projects/useSeen'
import Signature, { type SignatureHandle } from '@/features/signature/Signature'
import MixSwitch from '@/features/signature/MixSwitch'
import { ANAGRAMS } from '@/features/signature/anagrams'
import Fireworks from '@/features/fireworks/Fireworks'
import FireworksSwitch from '@/features/fireworks/FireworksSwitch'
import ScrollHint from './layout/ScrollHint'
import Links from './layout/Links'
import { COLS, NAME, ROWS, cardPlace, cardStart, fieldHeight, hintCol, nameStart } from './timeline'
import { useStickyLayout } from './useStickyLayout'
import './App.css'

// La page. D'abord les projets : les cartes montent une à une et se rangent sur une ligne, une colonne par
// projet (position: sticky ; au-delà de cinq, une seconde ligne), sur une grille CSS qu'on ne dessine pas.
// Ensuite la signature : le nom, en très grand. Une fois tout rangé, la page continue juste ce qu'il faut : la
// grille remonte d'un bloc. Un clic sur une carte ouvre sa fiche.
export default function App() {
  const N = COLS
  // la mise en place au défilement ; phase : 'scroll' (les projets montent) → 'done' (tous rangés)
  const { root, top, hint, phase } = useStickyLayout()
  const sheet = useSheetRoute(projects, root)
  const seen = useSeen(projects, sheet.sheet) // les projets déjà ouverts (un point bleu après leur nom)
  const [fireworks, setFireworks] = useState(false) // le mode feu d'artifice (éteint par défaut)
  const signature = useRef<SignatureHandle>(null)
  const [mix, setMix] = useState(0) // l'anagramme du nom affichée (0 : le nom ; le point bleu en haut)

  // le point de « hello, world. » : l'anagramme suivante (les lettres voyagent, et le feu d'artifice le sait)
  const nextMix = () => {
    const next = (mix + 1) % ANAGRAMS.length
    signature.current?.show(next)
    setMix(next)
  }

  return (
    <main className={`rg is-${phase}`} style={{ '--n': N, '--rows': ROWS, '--hint-col': hintCol }} ref={root}>
      {/* l'ondulation au survol des captures (seulement l'image, pas toute la carte) */}
      <Ripple root={root} item=".rg-card .shot" />

      {/* En haut de page, visible dès l'arrivée : « hello, world. » à gauche, les liens à droite ; les cartes se
          rangent juste en dessous */}
      <header className="rg-top" ref={top}>
        <h1>
          {/* le nom, seulement pour les lecteurs d'écran et les moteurs de recherche : à l'écran, c'est la
              signature, à la fin */}
          <strong className="sr">{me.name}</strong>
          <span>
            hello, world
            <MixSwitch mixed={mix !== 0} ready={phase === 'done'} onNext={nextMix} />
          </span>
        </h1>
        <Links />
      </header>

      <ScrollHint ref={hint} />
      <Fireworks on={fireworks} mix={mix} onEnd={() => setFireworks(false)} />

      <section className="rg-field" aria-label="Projets" style={{ '--field-h': fieldHeight }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} start={cardStart(i)} {...cardPlace(i)} seen={seen.includes(p.id)} onOpen={sheet.open} />
        ))}
        <Signature words={NAME} start={nameStart} ref={signature} />
        {/* le feu d'artifice, au bout de la ligne du nom : il arrive avec le dernier mot (le bouquet final) */}
        <FireworksSwitch
          on={fireworks}
          onToggle={() => setFireworks((f) => !f)}
          start={nameStart(NAME.length - 1)}
        />
      </section>

      {/* Fin de page, sous la grille, dans la page (vide : elle donne juste la place de finir de défiler) */}
      <div className="rg-end" />

      <ProjectSheet projects={projects} index={sheet.sheet} cols={N} onClose={sheet.close} onStep={sheet.step} />
    </main>
  )
}
