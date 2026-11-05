import './sommaire.css'
import { carnet } from '@/content/content'
import { BELLY, EARS, FEET, HEAD } from '@/features/yeti/art'
import { mount } from './carnet'

// Le sommaire du labo (/labo/, là où mène « labo → » de l'accueil) : les captures des expériences, deux par ligne,
// en grand, sans titre (leur nom, pour les lecteurs d'écran) ; chacune ouvre son expérience. En bas, comme le nom
// sur l'accueil : « labo », sous son filet, et le yéti debout dessus, tout à droite.

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <ul class="sm-grid">${carnet.pages
    .map(
      (p) => `
    <li><a href="${p.href}" aria-label="${p.name}">
      <img src="${p.src}" alt="${p.alt}" width="1200" height="750" decoding="async" />
    </a></li>`,
    )
    .join('')}
  </ul>
  <div class="sm-foot" aria-hidden="true"><span class="sm-word">labo</span><span class="sm-yeti">${[EARS, HEAD, BELLY, FEET]
    .map((l) => l.padEnd(9))
    .join('\n')}</span></div>`

// la page dans le carnet (voir carnet.ts)
mount()
