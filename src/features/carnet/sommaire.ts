import './sommaire.css'
import { carnet } from '@/content/content'
import { BELLY, EARS, FEET, HEAD } from '@/features/yeti/art'
import { mount } from './carnet'

// Le sommaire du labo (/labo/, là où mène « labo → » de l'accueil) : mis en page comme une fiche de projet. Sur
// les trois premières colonnes, l'aperçu, à la place de la capture de la fiche ; sur les deux dernières, la liste
// des expériences, à la place du texte (le numéro, le nom). Survoler un nom montre sa capture ; un clic sur le nom,
// ou sur l'image, ouvre l'expérience. En bas, comme le nom sur l'accueil : « labo », sous son filet, et le yéti
// debout dessus, tout à droite (sous la liste, il ne passe pas sur l'aperçu).

const main = document.querySelector<HTMLElement>('.sm')!
const pages = carnet.pages
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <div class="sm-grid">
    <a class="sm-preview" href="${pages[0].href}">
      <img src="${pages[0].src}" alt="${pages[0].alt}" width="1200" height="750" decoding="async" />
    </a>
    <ol class="sm-list">${pages
      .map(
        (p, i) => `
      <li><a href="${p.href}"${i ? '' : ' aria-current="true"'}>
        <span class="sm-n">${String(i + 1).padStart(2, '0')}</span><span class="sm-name">${p.name}<span class="sm-dot" aria-hidden="true">.</span></span>
      </a></li>`,
      )
      .join('')}
    </ol>
  </div>
  <div class="sm-foot" aria-hidden="true"><span class="sm-word">labo</span><span class="sm-yeti">${[EARS, HEAD, BELLY, FEET]
    .map((l) => l.padEnd(9))
    .join('\n')}</span></div>`

// l'expérience montrée : son nom en encre (et le point bleu), sa capture dans l'aperçu
const preview = main.querySelector<HTMLAnchorElement>('.sm-preview')!
const img = preview.querySelector('img')!
const links = [...main.querySelectorAll<HTMLAnchorElement>('.sm-list a')]
function show(i: number) {
  links.forEach((a, j) => a.toggleAttribute('aria-current', i === j))
  if (preview.href.endsWith(pages[i].href)) return
  preview.href = pages[i].href
  img.src = pages[i].src
  img.alt = pages[i].alt
}
links.forEach((a, i) => {
  a.addEventListener('pointerenter', () => show(i))
  a.addEventListener('focus', () => show(i))
})

// (les captures, chargées d'avance : au survol, l'aperçu change sans attendre)
const ahead = () => pages.slice(1).forEach((p) => (new Image().src = p.src))
if ('requestIdleCallback' in window) requestIdleCallback(ahead)
else setTimeout(ahead, 500)

// la page dans le carnet (voir carnet.ts)
mount()
