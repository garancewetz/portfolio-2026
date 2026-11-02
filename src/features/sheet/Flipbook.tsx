import { useState } from 'react'
import { BELLY, BELLY_LOW, EARS, EARS_DOWN, FEET, FLAP_FLAT, FLAP_UP, HAPPY, HEAD, LEGS, STEP } from '@/features/yeti/art'
import './Flipbook.css'

// Le petit dessin des coins de cahier : le yéti sans bras (celui de Ruban), un dessin par fiche, une étape plus tard
// que sur la fiche d'avant. En tournant vite les fiches (← →), il s'envole en battant des oreilles ; en arrière, le
// mouvement se rembobine.
// Cinq dessins qui s'enchaînent en boucle, sans fin, même en passant du dernier projet au premier.

// Accroupi (les oreilles couchées), il s'élance, s'envole en haut (les oreilles battent, content), redescend en
// planant, se pose. (Ses lignes de haut en bas, pour chacun des cinq temps, posé en bas.)
const YETI = [
  ['', '', '', '', EARS_DOWN, HEAD, BELLY_LOW],
  ['', '', EARS, HEAD, BELLY, STEP, ''],
  [FLAP_UP, HAPPY, BELLY, LEGS, '', '', ''],
  ['', FLAP_FLAT, HAPPY, BELLY, LEGS, '', ''],
  ['', '', '', EARS, HEAD, BELLY, FEET],
]

const mod = (a: number, n: number) => ((a % n) + n) % n
// (toutes les lignes de la même largeur : le dessin reste calé au même endroit)
const frame = (t: number) =>
  YETI[mod(t, YETI.length)]
    .map((line) => line.padEnd(9))
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
