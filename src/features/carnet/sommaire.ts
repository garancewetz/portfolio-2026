import './sommaire.css'
import { carnet } from '@/content/content'
import { mount } from './carnet'

// Le sommaire du labo (/labo/, là où mène la fiole de l'accueil) : sa page de garde, sans grand titre (il est
// là pour les lecteurs d'écran). Pas une fiche de projet : les pages, une ligne chacune, comme une table des
// matières (numéro, nom, points de conduite) ; la ligne survolée montre sa capture, à droite. Un clic tourne la
// page jusqu'à elle.

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 id="sm-title" class="sr">Labo</h1>
  <ol class="sm-list">
    ${carnet.pages
      .map(
        (p, i) => `
      <li${i ? '' : ' data-on'}>
        <a href="${p.href}">
          <span class="sm-n">${i + 1}</span>
          <span class="sm-name">${p.name}</span>
          <span class="sm-dots" aria-hidden="true"></span>
        </a>
        <img src="${p.src}" alt="${p.alt}" width="1200" height="750" decoding="async" />
      </li>`,
      )
      .join('')}
  </ol>`

// la ligne survolée (ou choisie au clavier) montre sa capture ; elle reste montrée quand la souris s'en va
const items = [...main.querySelectorAll('li')]
const show = (li: HTMLLIElement) => items.forEach((x) => x.toggleAttribute('data-on', x === li))
for (const li of items) {
  li.addEventListener('pointerenter', () => show(li))
  li.addEventListener('focusin', () => show(li))
}

// la page dans le carnet (voir carnet.ts)
mount()
