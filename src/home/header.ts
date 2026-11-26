import { calm, el } from './shared'

// The header: the small « Garance Wetzel », alone (the lab is a badge among the projects, see cards.ts). On the home page it
// scrolls back to the top; in the lab, lab.ts catches the click first and brings the home page back.

export function setupHeader() {
  const header = el(`
    <header class="top-bar mono">
      <a class="home" href="/">Garance Wetzel</a>
    </header>`)
  document.body.prepend(header)
  header.querySelector('.home')!.addEventListener('click', (e) => {
    e.preventDefault()
    scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
  })
}

export const homeLink = () => document.querySelector<HTMLAnchorElement>('.top-bar .home')!
