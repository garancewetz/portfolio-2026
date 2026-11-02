import type { Refusal } from './voice'

// L'arrivée : quelques lignes au milieu de la nuit, qui disent le principe, et demandent le micro. Puis un court
// réglage : on tient une note, confortable, et la lueur se règle sur cette voix (grave ou aiguë). Si le micro ne
// vient pas (refusé, absent, impossible ici), on le dit simplement, et on peut jouer au doigt.

const WHY: Record<Refusal, string> = {
  refused:
    'Le micro n’est pas autorisé. Pour chanter, autorisez-le pour ce site (le cadenas, à côté de l’adresse), puis réessayez.',
  absent: 'Aucun micro n’a été trouvé (ou une autre application l’utilise déjà). Branchez-en un, puis réessayez.',
  unsupported: 'Ce navigateur ne peut pas écouter le micro ici (il faut une page en https, et un navigateur récent).',
}

export function intro(main: HTMLElement, o: { mic: () => void; finger: () => void; skip: () => void }) {
  const box = document.createElement('section')
  box.className = 'vo-intro'
  box.setAttribute('aria-labelledby', 'vo-title')
  box.innerHTML = `
    <h1 id="vo-title" class="vo-title">Vocalise</h1>
    <div class="vo-step" data-step="ask">
      <p>Une petite lueur traverse la nuit. Elle avance seule ; vous, vous chantez.</p>
      <p>Plus la note est <em>aiguë</em>, plus elle monte ; plus elle est <em>grave</em>, plus elle descend. En
      silence, elle se pose doucement sur les collines.</p>
      <p>Des notes flottent sur son chemin : attrapez-les. Elles cachent une chanson.</p>
      <p class="vo-error" role="alert" hidden></p>
      <div class="vo-actions">
        <button type="button" class="vo-button" data-do="mic">chanter <span aria-hidden="true">→</span></button>
        <button type="button" class="vo-link" data-do="finger">jouer au doigt, sans micro</button>
      </div>
      <p class="vo-small">Le navigateur va demander le micro. Le son reste ici : rien n’est enregistré ni envoyé.</p>
    </div>
    <div class="vo-step" data-step="tune" hidden>
      <p>Tenez une note, confortable, sans forcer : la lueur se règle sur votre voix.</p>
      <p class="vo-heard" aria-live="polite">…</p>
      <div class="vo-bar" aria-hidden="true"><span></span></div>
      <div class="vo-actions">
        <button type="button" class="vo-link" data-do="skip">passer (une voix grave ou aiguë, de 80 à 600 Hz)</button>
      </div>
    </div>`
  main.append(box)

  const $ = <T extends HTMLElement>(s: string) => box.querySelector<T>(s)!
  const show = (step: string) => {
    for (const s of box.querySelectorAll<HTMLElement>('.vo-step')) s.hidden = s.dataset.step !== step
  }
  $('[data-do=mic]').addEventListener('click', o.mic)
  $('[data-do=finger]').addEventListener('click', o.finger)
  $('[data-do=skip]').addEventListener('click', o.skip)
  // (les clics et les appuis sur ces lignes ne sont pas pour la lueur)
  box.addEventListener('pointerdown', (e) => e.stopPropagation())

  const bar = $('.vo-bar span')
  const heard = $('.vo-heard')
  return {
    // en attendant la réponse du navigateur
    asking(on: boolean) {
      $<HTMLButtonElement>('[data-do=mic]').disabled = on
    },
    // le micro ne vient pas : pourquoi, et l'autre façon de jouer, mise en avant
    fail(why: Refusal) {
      show('ask')
      const error = $('.vo-error')
      error.textContent = `${WHY[why]} Ou jouez au doigt : appuyez sur la page, plus haut pour monter.`
      error.hidden = false
      $('[data-do=mic]').textContent = why === 'unsupported' ? 'chanter' : 'réessayer'
      $<HTMLButtonElement>('[data-do=mic]').hidden = why === 'unsupported'
      $('[data-do=finger]').className = 'vo-button'
    },
    // le réglage : la note entendue, et ce qu'il reste à la tenir (de 0 à 1)
    tune(note: string | null, held: number) {
      show('tune')
      heard.textContent = note ?? '…'
      bar.style.transform = `scaleX(${held})`
    },
    close() {
      box.classList.add('is-off')
      setTimeout(() => box.remove(), 900)
    },
  }
}
