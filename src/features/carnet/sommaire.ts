import './sommaire.css'
import { carnet } from '@/content/content'
import type { Page } from '@/content/types'
import { mount } from './carnet'
import { book } from './book'

// Le sommaire du labo (/labo/, là où mène la fiole de l'accueil) : un carnet ouvert, au format paysage, posé sur la
// table. Deux pages côte à côte, une expérience sur chacune (sa capture, son nom, son numéro) ; un clic sur la page
// la tourne et montre les deux suivantes (voir book.ts). La capture, elle, ouvre l'expérience.

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <div class="sm-book"></div>`

// une page du carnet : la capture (lien vers l'expérience), son nom dessous, le numéro dans le coin du bas ;
// au-delà de la dernière, une page blanche
function page(p: Page | undefined, i: number) {
  if (!p) return '<div class="sm-blank"></div>'
  return `
    <a class="sm-shot" href="${p.href}" aria-label="Ouvrir ${p.name}">
      <img src="${p.src}" alt="${p.alt}" width="1200" height="750" decoding="async" />
    </a>
    <a class="sm-name" href="${p.href}">${p.name}</a>
    <span class="sm-n" aria-hidden="true">${i + 1}</span>`
}

book(main.querySelector<HTMLElement>('.sm-book')!, carnet.pages.length, (i) => page(carnet.pages[i], i))

// la page dans le carnet (voir carnet.ts)
mount()
