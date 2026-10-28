// Le chemin de la visite : les pages vues, dans l'ordre, gardées par le site lui-même le temps de l'onglet
// (sessionStorage : rien n'est envoyé, tout s'efface en fermant l'onglet). La page Abyme le remonte (voir
// features/abyme). Une page : son adresse (avec la fiche ouverte, #id) et son titre.

export type Step = { path: string; title: string }
const KEY = 'gw-trail'

export function trail(): Step[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function add() {
  const step = { path: location.pathname + location.hash, title: document.title }
  const steps = trail()
  // (une fiche qu'on referme : on revient sur la page, ce n'est pas une page de plus)
  if (!location.hash && steps.at(-1)?.path.startsWith(`${location.pathname}#`)) return
  // (la même page, rechargée : une seule fois)
  if (steps.at(-1)?.path === step.path) steps.pop()
  steps.push(step)
  try {
    sessionStorage.setItem(KEY, JSON.stringify(steps.slice(-40)))
  } catch {
    // (stockage refusé : pas de chemin, tant pis)
  }
}

// noter cette page, et chaque fiche qu'on y ouvre : une fiche change l'adresse (#id) sans recharger la page, et
// change le titre ; c'est le titre qu'on guette
export function remember() {
  // (la page d'accueil montrée au fond d'Abyme, dans une iframe : ce n'est pas une page de la visite)
  if (window !== window.top) return
  add()
  const title = document.querySelector('title')
  if (title) new MutationObserver(() => setTimeout(add)).observe(title, { childList: true, characterData: true, subtree: true })
}
