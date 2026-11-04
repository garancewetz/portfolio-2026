// Le jour et la nuit de la page. Le jour : le blanc du site, et des traits aux encres de risographie. La nuit : un
// fond d'encre, des lignes claires, et des traits pastel lumineux, comme à la craie sur un tableau noir. Au départ,
// comme le système du visiteur (ou comme il l'a choisi la dernière fois) ; un bouton dans la ligne du carnet passe
// de l'un à l'autre.

type Palette = { trails: string[]; line: string }

const DAY: Palette = {
  // (rose fluo, jaune, vert, orange, bleu, violet, rouge)
  trails: ['#ff48b0', '#ffb511', '#00a95c', '#ff6c2f', '#0078bf', '#765ba7', '#f15060'],
  line: 'rgb(26 25 23 / 0.3)',
}
const NIGHT: Palette = {
  trails: ['#ffb3a7', '#ffe08a', '#b8e6a1', '#9fe0d3', '#a9c8ff', '#d2b8ff', '#ffb3d9'],
  line: 'rgb(244 239 230 / 0.35)',
}

const KEY = 'creatures-nuit'

// night : la nuit ; v : change à chaque bascule (les toiles se redessinent)
export const theme = { night: false, v: 0 }
export const palette = () => (theme.night ? NIGHT : DAY)

const remembered = () => {
  try {
    const v = localStorage.getItem(KEY)
    return v === null ? null : v === '1'
  } catch {
    return null
  }
}

export function switcher(slot?: HTMLElement | null) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cr-theme'
  const set = (night: boolean) => {
    theme.night = night
    theme.v++
    document.documentElement.dataset.theme = night ? 'nuit' : 'jour'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#1a1917' : '#ffffff')
    // (︎ : le signe en caractère, pas en émoji)
    button.textContent = night ? '☀︎' : '☾'
    button.setAttribute('aria-label', night ? 'passer au jour' : 'passer à la nuit')
  }
  set(remembered() ?? matchMedia('(prefers-color-scheme: dark)').matches)
  button.addEventListener('click', () => {
    set(!theme.night)
    try {
      localStorage.setItem(KEY, theme.night ? '1' : '0')
    } catch {
      // (pas de mémoire : tant pis, on recommencera comme le système)
    }
  })
  slot?.append(button)
}
