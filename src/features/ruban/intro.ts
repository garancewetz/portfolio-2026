import type { Refusal } from './voice'

// The arrival: in the middle of the black, the title, and two buttons: sing (asking for the mic) or draw with a
// finger; nothing else (everything is discovered). If the mic does not come (refused, missing, impossible
// here), we just say so, and you can play with a finger.

const WHY: Record<Refusal, string> = {
  refused:
    'Le micro n’est pas autorisé. Pour chanter, autorisez-le pour ce site (le cadenas, à côté de l’adresse), puis réessayez.',
  absent: 'Aucun micro n’a été trouvé (ou une autre application l’utilise déjà). Branchez-en un, puis réessayez.',
  unsupported: 'Ce navigateur ne peut pas écouter le micro ici (il faut une page en https, et un navigateur récent).',
}

export function intro(main: HTMLElement, o: { mic: () => void; finger: () => void }) {
  const box = document.createElement('section')
  box.className = 'ru-intro'
  box.setAttribute('aria-labelledby', 'ru-title')
  box.innerHTML = `
    <h1 id="ru-title" class="ru-title">Ruban</h1>
    <p class="ru-error" role="alert" hidden></p>
    <div class="ru-actions">
      <button type="button" class="ru-button" data-do="mic">chanter <span aria-hidden="true">→</span></button>
      <button type="button" class="ru-link" data-do="finger">dessiner au doigt, sans micro</button>
    </div>`
  main.append(box)

  const $ = <T extends HTMLElement>(s: string) => box.querySelector<T>(s)!
  const mic = $<HTMLButtonElement>('[data-do=mic]')
  const finger = $('[data-do=finger]')
  mic.addEventListener('click', o.mic)
  finger.addEventListener('click', o.finger)
  // (presses on these lines do not draw)
  box.addEventListener('pointerdown', (e) => e.stopPropagation())

  return {
    // while waiting for the browser's answer
    asking(on: boolean) {
      mic.disabled = on
    },
    // the mic does not come: why, and the other way to play, put forward
    fail(why: Refusal) {
      const error = $('.ru-error')
      error.textContent = `${WHY[why]} Ou dessinez au doigt : appuyez sur la page, plus haut pour une note plus aiguë.`
      error.hidden = false
      mic.textContent = 'réessayer'
      mic.hidden = why === 'unsupported'
      finger.className = 'ru-button'
    },
    close() {
      box.classList.add('is-off')
      setTimeout(() => box.remove(), 900)
    },
  }
}
