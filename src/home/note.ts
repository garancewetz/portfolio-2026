import { leaveFor } from './cards'
import { PROJECTS } from './data'
import { el } from './shared'

// A project's note, on the home page itself (a project has no page of its own): hovering its badge (or reaching it
// with Tab, or touching it on a phone) writes what it is, its sentence and its links (the site, the code) under the
// badges; it stays there, so that the links can be reached. A click on the background lets it go (see
// cards.ts), Escape too. The visible text is in French, like the site.

const note = el(`
  <aside class="project-note" aria-live="polite">
    <p class="kind mono"></p>
    <p class="short"></p>
    <p class="links mono"></p>
  </aside>`)
const kind = note.querySelector('.kind')!
const short = note.querySelector('.short')!
const links = note.querySelector('.links')!

export function showNote(id: string) {
  const p = PROJECTS.find((x) => x.id === id)
  if (!p) return
  kind.textContent = p.kind
  short.textContent = p.short
  // (a page of this site opens here; another site, in a new tab)
  const own = p.demo?.startsWith('/')
  const away = '<span class="sr"> (nouvel onglet)</span>'
  const site = !p.demo ? '<span>en cours · bientôt en ligne</span>' : own ? `<a href="${p.demo}" data-own="${p.id}">voir la page →</a>` : `<a href="${p.demo}" target="_blank" rel="noopener">voir le site ↗${away}</a>`
  const code = p.code ? `<a href="${p.code}" target="_blank" rel="noopener">le code ↗${away}</a>` : ''
  links.innerHTML = [site, code].filter(Boolean).join('')
  note.classList.add('on')
}

export const hideNote = () => note.classList.remove('on')

export function setupNote() {
  document.body.append(note)
  // (a page of this site: the home page notes where it was, as for a click on the badge)
  links.addEventListener('click', (e) => {
    const own = (e.target as Element).closest<HTMLAnchorElement>('a[data-own]')
    if (own) leaveFor(own.dataset.own!)
  })
}
