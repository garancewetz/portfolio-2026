import './sommaire.css'
import { carnet } from '@/content/content'
import { BELLY, EARS, FEET, HEAD } from '@/features/yeti/art'
import { mount } from './carnet'

// Le sommaire du labo (/labo/, là où mène « labo → » de l'accueil) : une liste. Une ligne par expérience, sous un
// filet : son numéro et son nom, une petite capture au bout ; toute la ligne ouvre l'expérience. En bas, comme le
// nom sur l'accueil : « labo », sous son filet, et le yéti debout dessus, tout à droite.

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <ol class="sm-rows">${carnet.pages
    .map(
      (p, i) => `
    <li><a class="sm-row" href="${p.href}">
      <span class="sm-label"><span class="sm-n">${String(i + 1).padStart(2, '0')}</span><span class="sm-name">${p.name}</span></span>
      <img src="${p.src}" alt="${p.alt}" width="1200" height="750" decoding="async" />
    </a></li>`,
    )
    .join('')}
  </ol>
  <div class="sm-foot" aria-hidden="true"><span class="sm-word">labo</span><span class="sm-yeti">${[EARS, HEAD, BELLY, FEET]
    .map((l) => l.padEnd(9))
    .join('\n')}</span></div>`

// la page dans le carnet (voir carnet.ts)
mount()
