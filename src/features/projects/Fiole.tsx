import { carnet } from '@/content/content'
import './Fiole.css'

// Le carnet d'expériences, sur l'accueil : une toute petite fiole de labo dessinée en caractères (les
// expérimentations), seule dans la marge en haut à droite (elle se suffit). Elle mène au sommaire du carnet, sa
// propre page. Elle fume : des bulles s'échappent par le goulot ; au survol, elles ont bougé.

// les deux états du dessin : au repos, au survol (même largeur, même nombre de lignes)
const REST = [
  '   ° . ',
  '  o    ',
  '  _|_  ',
  '  | |  ',
  ' /   \\ ',
  '/~~~~~\\',
  '\\o_._o/',
]
const HOVER = [
  ' °   . ',
  '   o   ',
  '  _|_  ',
  '  |.|  ',
  ' / o \\ ',
  '/~~~~~\\',
  '\\.o_o./',
]
// (le liquide et ses bulles, en couleur : tout ce qui n'est pas le verre)
const LIQUID = /([~oO.°])/

function Drawing({ lines, className }: { lines: string[]; className: string }) {
  return (
    <pre className={className} aria-hidden>
      {lines
        .map((line) => line.split(LIQUID).map((s, k) => (k % 2 ? <b key={k}>{s}</b> : s)))
        .flatMap((l, y) => (y ? ['\n', l] : [l]))}
    </pre>
  )
}

export default function Fiole() {
  return (
    <a className="rg-fiole" href={carnet.href} aria-label="Ouvrir le labo">
      <span className="rg-fiole-draw">
        <Drawing lines={REST} className="rg-fiole-rest" />
        <Drawing lines={HOVER} className="rg-fiole-hover" />
      </span>
    </a>
  )
}
