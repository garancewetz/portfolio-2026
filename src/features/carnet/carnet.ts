import './carnet.css'

// Le carnet : les expériences, chacune sur sa page (sa propre adresse), qu'on parcourt comme un carnet. En haut de
// chaque page, discrètement : « carnet » (retour au site) et le numéro de page à gauche ; la page d'avant et celle
// d'après, par leur nom, à droite. On tourne la page en glissant d'une page à l'autre (une View Transition entre
// documents, là où le navigateur la connaît ; ailleurs, on change simplement de page).

// les pages, dans l'ordre du carnet (pour en ajouter une : une ligne ici, et `mount()` dans son main.ts)
const PAGES = [
  { path: '/murmuration/', name: 'murmuration' },
  { path: '/arc-en-ciel/', name: 'arc-en-ciel' },
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
    <span><a href="/">carnet</a> <span class="carnet-page">${here + 1}/${PAGES.length}</span></span>
    <span class="carnet-turn">
      ${prev ? `<a href="${prev.path}" rel="prev">← ${prev.name}</a>` : ''}
      ${next ? `<a href="${next.path}" rel="next">${next.name} →</a>` : ''}
    </span>`
  // (les pages écoutent les clics et le clavier sur toute la fenêtre — un clic fait s'envoler les oiseaux, Entrée
  // aussi : ce qui se passe sur le carnet ne les concerne pas)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown'])
    nav.addEventListener(type, (e) => e.stopPropagation())
  document.body.append(nav)
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
  if (a < 0 || b < 0 || a === b) return transition.skipTransition()
  transition.types?.add(b > a ? 'forward' : 'backward')
})
