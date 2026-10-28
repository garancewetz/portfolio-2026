import './carnet.css'
import './sheet'
import { remember } from '@/shared/trail'

// Le carnet du labo : les expériences, chacune sur sa page (sa propre adresse), qu'on parcourt comme un carnet. En
// haut de chaque page, discrètement : « labo » (retour au sommaire ; sur le sommaire, « accueil », retour au site)
// et le numéro de page à gauche ; la page d'avant et celle d'après, par leur nom, à droite. Chaque page prend tout
// l'écran (voir sheet.ts). En tournant la page, on voit le carnet : la page recule et se pose sur la table, la
// suivante glisse par-dessus puis s'agrandit jusqu'à remplir l'écran (une View Transition entre documents, là où
// le navigateur la connaît ; ailleurs, on change simplement de page).

// les pages, dans l'ordre du carnet (pour en ajouter une : une ligne ici, et `mount()` dans son main.ts)
// (la première, le sommaire : la page de garde, sans numéro ; voir sommaire.ts)
const PAGES = [
  { path: '/labo/', name: 'sommaire' },
  { path: '/murmuration/', name: 'murmuration' },
  { path: '/fourrure/', name: 'fourrure' },
  // (Yaya : cachée pour le moment ; sa page existe toujours, à /yaya/, sans lien)
  { path: '/toupies/', name: 'toupies' },
  { path: '/escalade/', name: 'escalade' },
  { path: '/feu/', name: 'feu d’artifice' },
  // (Abyme à la fin : elle remonte la visite)
  { path: '/abyme/', name: 'abyme' },
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
    <span class="carnet-left">${
      here
        ? `<a href="${PAGES[0].path}">labo</a> <span class="carnet-page">${here}/${PAGES.length - 1}</span>`
        : '<a href="/">← accueil</a>'
    }</span>
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

// tourner la page : vers l'avant, la nouvelle page arrive par la droite ; vers l'arrière, par la gauche
addEventListener('pagereveal', (e) => {
  const transition = (e as Event & { viewTransition?: ViewTransition | null }).viewTransition
  const from = (globalThis as { navigation?: { activation?: { from?: { url: string } | null } } }).navigation
    ?.activation?.from?.url
  if (!transition || !from) return
  const a = indexOf(from)
  const b = indexOf(location.href)
  // (en arrivant d'ailleurs que du carnet, du site par exemple : pas de page qui tourne)
  if (a < 0 || b < 0 || a === b) {
    // (sans quoi le navigateur signale, à tort, une erreur)
    transition.ready.catch(() => {})
    return transition.skipTransition()
  }
  transition.types?.add(b > a ? 'forward' : 'backward')
})
