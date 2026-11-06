import './sommaire.css'
import { carnet } from '@/content/content'
import { BELLY, EARS, FEET, HEAD } from '@/features/yeti/art'
import { mount } from './carnet'

// Le sommaire du labo (/labo/, là où mène « labo → » de l'accueil) : les expériences en petites vignettes, six par
// ligne, chacune sa capture, son numéro et son nom dessous (comme les cartes de l'accueil) ; chacune ouvre son
// expérience. En bas, comme le nom
// sur l'accueil : « labo », sous son filet, et le yéti debout dessus, tout à droite.

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <ul class="sm-grid">${carnet.pages
    .map(
      (p, i) => `
    <li><a href="${p.href}">
      <img src="${p.src}" alt="${p.alt}" width="1200" height="750" decoding="async" />
      <span class="sm-name"><span class="sm-n">${String(i + 1).padStart(2, '0')}</span>${p.name}</span>
    </a></li>`,
    )
    .join('')}
  </ul>
  <div class="sm-foot" aria-hidden="true"><span class="sm-word">labo</span><span class="sm-yeti">${[
    EARS,
    HEAD,
    BELLY,
    FEET,
  ]
    .map((l) => l.padEnd(9))
    .join('\n')}</span></div>`

// la page dans le carnet (voir carnet.ts)
mount()
