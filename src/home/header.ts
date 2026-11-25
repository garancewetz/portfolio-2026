import { calm, el } from './shared'

// The header: « hello, world. », alone (the lab is a badge among the projects, see cards.ts). On the home page it
// scrolls back to the top; from a project page or the lab, project.ts and lab.ts catch the click first and bring the
// home page back.

export function setupHeader() {
  const header = el(`
    <header class="top-bar mono">
      <a class="home" href="/">hello, world<span class="dot">.</span></a>
    </header>`)
  document.body.prepend(header)
  header.querySelector('.home')!.addEventListener('click', (e) => {
    e.preventDefault()
    scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
  })
}

export const homeLink = () => document.querySelector<HTMLAnchorElement>('.top-bar .home')!
