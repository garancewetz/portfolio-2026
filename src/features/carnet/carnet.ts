import './carnet.css'
import './sheet'
import { remember } from '@/shared/trail'

// Le carnet du labo : les expériences, chacune sur sa page (sa propre adresse), qu'on parcourt comme un carnet. En
// haut de chaque page, discrètement : « labo » et le numéro de page à gauche ; la page d'avant et celle d'après, par
// leur nom, à droite. Chaque page prend tout l'écran (voir sheet.ts) ; on passe de l'une à l'autre simplement, sans
// animation.
// (the lab itself, its table of contents, is on the home page: /?labo, see public/accueil/lab.js)
const LAB = '/?labo'

// les pages, dans l'ordre du carnet (pour en ajouter une : une ligne ici, et `mount()` dans son main.ts)
const PAGES = [
  // (dans un ordre qui alterne les captures claires et sombres : le sommaire, en bichromie, respire)
  { path: '/toupies/', name: 'toupies' },
  { path: '/murmuration/', name: 'murmuration' },
  { path: '/creatures/', name: 'créatures' },
  { path: '/ruban/', name: 'ruban' },
  // (Abyme à la fin : elle remonte la visite)
  { path: '/abyme/', name: 'abyme' },
  // (cachées pour le moment, leurs pages existent toujours, sans lien : Yaya, à /yaya/ ; Escalade, à /escalade/,
  // dont Créatures reprend l'idée ; Morse, à /morse/ ; Feu d'artifice, à /feu/, sur l'accueil en mode secret)
]

const indexOf = (url: string) => PAGES.findIndex((p) => new URL(url, location.href).pathname.startsWith(p.path))

export function mount() {
  // (le chemin de la visite, pour la page Abyme)
  remember()
  // (montrée dans une fenêtre d'Abyme, dans une iframe : ses liens s'ouvrent dans la fenêtre entière)
  if (window !== window.top) document.head.append(Object.assign(document.createElement('base'), { target: '_top' }))
  const here = indexOf(location.href)
  if (here < 0) return
  const prev = PAGES[here - 1]
  const next = PAGES[here + 1]

  const nav = document.createElement('nav')
  nav.className = 'carnet'
  nav.setAttribute('aria-label', 'Carnet')
  nav.innerHTML = `
    <span class="carnet-left"><a href="${LAB}">labo</a> <span class="carnet-page">${here + 1}/${PAGES.length}</span></span>
    <span class="carnet-turn">
      ${prev ? `<a href="${prev.path}" rel="prev">← ${prev.name}</a>` : ''}
      ${next ? `<a href="${next.path}" rel="next">${next.name} →</a>` : ''}
    </span>`
  // (les pages écoutent les clics, le clavier et la molette sur toute la fenêtre — un clic fait s'envoler les
  // oiseaux, Entrée aussi : ce qui se passe sur le carnet, ou sur ce qu'une page y ajoute, ne les concerne pas)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel'])
    nav.addEventListener(type, (e) => e.stopPropagation())
  document.body.append(nav)

  // (une page peut y ajouter ses propres outils, à gauche, après le numéro de page)
  return nav.querySelector<HTMLElement>('.carnet-left')
}
