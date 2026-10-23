import { useState } from 'react'
import './Flipbook.css'

// Le petit dessin des coins de cahier : Totoro et un oiseau, un dessin par fiche, une étape plus tard que sur la
// fiche d'avant. En tournant vite les fiches (← →), Totoro saute et l'oiseau bat des ailes ; en arrière, le
// mouvement se rembobine.
// Cinq dessins qui s'enchaînent en boucle, sans fin, même en passant du dernier projet au premier.

// Totoro, en poire (petite tête aux grandes oreilles droites, gros ventre rond aux chevrons, deux pieds) :
// ramassé (assis sur son ventre, les pieds rentrés), il s'élance, en haut (content), redescend, se pose.
const EARS = ' /| |\\'
const HEAD = ' (o.o)'
const CHEVRONS = '( ^^^ )'
const BELLY = '(     )'
const FEET = ' \\/ \\/'
// (ses lignes de haut en bas, pour chacun des cinq temps, posé en bas)
const TOTORO = [
  ['', '', '', EARS, HEAD, CHEVRONS, BELLY],
  ['', EARS, HEAD, CHEVRONS, BELLY, FEET, ''],
  [EARS, ' (^.^)', CHEVRONS, BELLY, FEET, '', ''],
  ['', EARS, HEAD, CHEVRONS, BELLY, FEET, ''],
  ['', '', EARS, HEAD, CHEVRONS, BELLY, FEET],
]

// l'oiseau, à droite, vole sur place à mi-hauteur de Totoro : seules ses ailes bougent (en haut, à plat, en bas,
// à plat, en haut)
const BIRD = ['\\v/', '-v-', '/v\\', '_v_', '-v-']
const BIRD_ROW = 3

const mod = (a: number, n: number) => ((a % n) + n) % n
// Totoro à gauche, l'oiseau à droite (toutes les lignes de la même largeur : le dessin reste calé au même endroit)
const frame = (t: number) =>
  TOTORO[mod(t, TOTORO.length)]
    .map((line, row) => line.padEnd(10) + (row === BIRD_ROW ? BIRD[mod(t, BIRD.length)] : '   '))
    .join('\n')

interface FlipbookProps {
  /** la fiche ouverte (son index) */
  page: number
  /** nombre de fiches */
  pages: number
}

export default function Flipbook({ page, pages }: FlipbookProps) {
  // le nombre d'étapes depuis l'ouverture : +1 par fiche suivante, -1 par fiche précédente (sans retour à zéro
  // après le dernier projet)
  const [run, setRun] = useState({ page, steps: page })
  if (run.page !== page) {
    const d = mod(page - run.page, pages)
    setRun({ page, steps: run.steps + (d === pages - 1 ? -1 : d) })
  }
  return (
    <pre className="rg-flipbook" aria-hidden>
      {frame(run.steps)}
    </pre>
  )
}
