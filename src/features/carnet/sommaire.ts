import './sommaire.css'
import { carnet } from '@/content/content'
import type { Page } from '@/content/types'
import { mount } from './carnet'
import { book } from './book'

// Le sommaire du labo (/labo/, là où mène la fiole de l'accueil) : un carnet ouvert, au format paysage, posé sur la
// table. Deux pages côte à côte, une expérience sur chacune (sa capture, son nom, son numéro) ; un clic sur la page
// la tourne et montre les deux suivantes (voir book.ts). La capture, elle, ouvre l'expérience. En bas, le sommaire :
// les noms de toutes les pages sur une ligne, pour aller tout de suite à l'une d'elles (celles qu'on voit, en
// encre).

const main = document.querySelector<HTMLElement>('.sm')!
main.innerHTML = `
  <h1 class="sr">Labo</h1>
  <div class="sm-book"></div>
  <nav class="sm-toc" aria-label="Sommaire">${carnet.pages
    .map((p, i) => `<button type="button" data-i="${i}"><span>${i + 1}</span> ${p.name}</button>`)
    .join('')}</nav>`

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

const toc = [...main.querySelectorAll<HTMLButtonElement>('.sm-toc button')]
// (les pages montrées : en encre dans le sommaire)
const show = (first: number, shown: number) =>
  toc.forEach((b, i) => b.toggleAttribute('aria-current', i >= first && i < first + shown))
const { go } = book(main.querySelector<HTMLElement>('.sm-book')!, carnet.pages.length, (i) => page(carnet.pages[i], i), show)
toc.forEach((b, i) => b.addEventListener('click', () => go(i)))

// la page dans le carnet (voir carnet.ts)
mount()
