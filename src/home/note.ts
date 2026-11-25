import { PROJECTS } from './data'
import { el } from './shared'

// A project's note, on the home page itself (a project has no page of its own): hovering its badge (or reaching it
// with Tab, or touching it on a phone) writes what it is, its sentence and its links (the site, the code) under
// « Garance Wetzel »; it stays there, so that the links can be reached. Escape lets it go. The visible text is in
// French, like the site.

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
  const site = p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">voir le site ↗</a>` : '<span>en cours · bientôt en ligne</span>'
  const code = p.code ? `<a href="${p.code}" target="_blank" rel="noopener">le code ↗</a>` : ''
  links.innerHTML = [site, code].filter(Boolean).join('')
  note.classList.add('on')
}

export function setupNote() {
  document.body.append(note)
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') note.classList.remove('on')
  })
}
