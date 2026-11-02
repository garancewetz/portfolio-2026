import { RULES } from './rules'
import type { Refusal } from './voice'

// L'arrivée : au milieu du noir, le principe et les règles du ruban, et la demande du micro. Si le micro ne vient
// pas (refusé, absent, impossible ici), on le dit simplement, et on peut jouer au doigt.

const WHY: Record<Refusal, string> = {
  refused:
    'Le micro n’est pas autorisé. Pour chanter, autorisez-le pour ce site (le cadenas, à côté de l’adresse), puis réessayez.',
  absent: 'Aucun micro n’a été trouvé (ou une autre application l’utilise déjà). Branchez-en un, puis réessayez.',
  unsupported: 'Ce navigateur ne peut pas écouter le micro ici (il faut une page en https, et un navigateur récent).',
}

export function intro(main: HTMLElement, o: { mic: () => void; finger: () => void }) {
  const box = document.createElement('section')
  box.className = 'vo-intro'
  box.setAttribute('aria-labelledby', 'vo-title')
  box.innerHTML = `
    <h1 id="vo-title" class="vo-title">Vocalise</h1>
    <p>Chantez : votre voix dessine un ruban de lumière dans le noir.</p>
    ${RULES}
    <p class="vo-error" role="alert" hidden></p>
    <div class="vo-actions">
      <button type="button" class="vo-button" data-do="mic">chanter <span aria-hidden="true">→</span></button>
      <button type="button" class="vo-link" data-do="finger">dessiner au doigt, sans micro</button>
    </div>
    <p class="vo-small">Le navigateur va demander le micro. Le son reste ici : rien n’est enregistré ni envoyé.</p>`
  main.append(box)

  const $ = <T extends HTMLElement>(s: string) => box.querySelector<T>(s)!
  const mic = $<HTMLButtonElement>('[data-do=mic]')
  const finger = $('[data-do=finger]')
  mic.addEventListener('click', o.mic)
  finger.addEventListener('click', o.finger)
  // (les appuis sur ces lignes ne dessinent pas)
  box.addEventListener('pointerdown', (e) => e.stopPropagation())

  return {
    // en attendant la réponse du navigateur
    asking(on: boolean) {
      mic.disabled = on
    },
    // le micro ne vient pas : pourquoi, et l'autre façon de jouer, mise en avant
    fail(why: Refusal) {
      const error = $('.vo-error')
      error.textContent = `${WHY[why]} Ou dessinez au doigt : appuyez sur la page, plus haut pour une note plus aiguë.`
      error.hidden = false
      mic.textContent = 'réessayer'
      mic.hidden = why === 'unsupported'
      finger.className = 'vo-button'
    },
    close() {
      box.classList.add('is-off')
      setTimeout(() => box.remove(), 900)
    },
  }
}
