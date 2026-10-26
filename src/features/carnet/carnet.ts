import './carnet.css'
import './sheet'

// Le carnet : les expériences, chacune sur sa page (sa propre adresse), qu'on parcourt comme un carnet. En haut de
// chaque page, discrètement : « carnet » (retour au site) et le numéro de page à gauche ; la page d'avant et celle
// d'après, par leur nom, à droite. Chaque page prend tout l'écran, cornée en bas à droite (voir sheet.ts) : le coin
// tourne la page (la dernière ramène à la première). En tournant la page, on voit le carnet : la page recule et se
// pose sur la table, la suivante glisse par-dessus puis s'agrandit jusqu'à remplir l'écran (une View Transition
// entre documents, là où le navigateur la connaît ; ailleurs, on change simplement de page).

// les pages, dans l'ordre du carnet (pour en ajouter une : une ligne ici, et `mount()` dans son main.ts)
const PAGES = [
  { path: '/murmuration/', name: 'murmuration' },
  { path: '/fourrure/', name: 'fourrure' },
  { path: '/yaya/', name: 'yaya' },
]

const indexOf = (url: string) => PAGES.findIndex((p) => new URL(url, location.href).pathname.startsWith(p.path))

export function mount() {
  const here = indexOf(location.href)
  if (here < 0) return
  const prev = PAGES[here - 1]
  const next = PAGES[here + 1]

  const nav = document.createElement('nav')
  nav.className = 'carnet'
  nav.setAttribute('aria-label', 'Carnet')
  nav.innerHTML = `
    <span class="carnet-left"><a href="/">carnet</a> <span class="carnet-page">${here + 1}/${PAGES.length}</span></span>
    <span class="carnet-turn">
      ${prev ? `<a href="${prev.path}" rel="prev">← ${prev.name}</a>` : ''}
      ${next ? `<a href="${next.path}" rel="next">${next.name} →</a>` : ''}
    </span>`
  // (les pages écoutent les clics, le clavier et la molette sur toute la fenêtre — un clic fait s'envoler les
  // oiseaux, Entrée aussi : ce qui se passe sur le carnet, ou sur ce qu'une page y ajoute, ne les concerne pas)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel'])
    nav.addEventListener(type, (e) => e.stopPropagation())
  document.body.append(nav)

  // le coin corné : la page suivante (après la dernière, on revient à la première)
  const turn = next ?? PAGES[0]
  const corner = document.createElement('a')
  corner.className = 'carnet-corner'
  corner.href = turn.path
  corner.setAttribute('aria-label', `Tourner la page : ${turn.name}`)
  corner.innerHTML = '<span></span>'
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel'])
    corner.addEventListener(type, (e) => e.stopPropagation())
  document.body.append(corner)
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
