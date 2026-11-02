import type { Refusal } from './voice'

// L'arrivée : quelques lignes au milieu de la nuit, qui disent le principe, et demandent le micro. Puis un court
// essai : on dit « aaah », une seconde, pour voir que le micro entend (le trait se remplit tant qu'il entend). Si le
// micro ne vient pas (refusé, absent, impossible ici), on le dit simplement, et on peut jouer au doigt.

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
      <p>Une petite lueur court sur les collines, la nuit. Devant elle, des précipices.</p>
      <p>Faites un son, n’importe lequel : elle <em>saute</em>. Tant que le son dure, elle <em>plane</em> ; quand il
      s’arrête, elle retombe.</p>
      <p>Au-dessus de chaque précipice, ce qu’il demande : « a », un saut ; « aaaaaaa », un long souffle.</p>
      <p class="vo-error" role="alert" hidden></p>
      <div class="vo-actions">
        <button type="button" class="vo-button" data-do="mic">chanter <span aria-hidden="true">→</span></button>
        <button type="button" class="vo-link" data-do="finger">jouer au doigt, sans micro</button>
      </div>
      <p class="vo-small">Le navigateur va demander le micro. Le son reste ici : rien n’est enregistré ni envoyé.</p>
    </div>
    <div class="vo-step" data-step="tune" hidden>
      <p>Pour essayer : dites « aaah », une seconde, comme chez le médecin.</p>
      <p class="vo-heard" aria-live="polite">…</p>
      <div class="vo-meter" aria-hidden="true"><span></span></div>
      <div class="vo-bar" aria-hidden="true"><span></span></div>
      <p class="vo-small vo-deaf" hidden>Le micro n’entend presque rien. Est-ce le bon ? (le cadenas, à côté de
      l’adresse, permet d’en choisir un autre ; puis rechargez la page)</p>
      <div class="vo-actions">
        <button type="button" class="vo-link" data-do="skip">passer</button>
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
  const meter = $('.vo-meter span')
  const deaf = $('.vo-deaf')
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
      error.textContent = `${WHY[why]} Ou jouez au doigt : appuyez sur la page, et tenez pour planer (ou la barre d’espace).`
      error.hidden = false
      $('[data-do=mic]').textContent = why === 'unsupported' ? 'chanter' : 'réessayer'
      $<HTMLButtonElement>('[data-do=mic]').hidden = why === 'unsupported'
      $('[data-do=finger]').className = 'vo-button'
    },
    // l'essai : est-ce qu'on entend un son, depuis combien de temps (de 0 à 1), le volume (la jauge : le seuil à
    // mi-hauteur), et si le micro semble sourd
    tune(on: boolean, held: number, volume: number, silent: boolean) {
      show('tune')
      meter.style.transform = `scaleX(${volume})`
      deaf.hidden = !silent
      heard.textContent = on ? 'a'.repeat(2 + Math.round(held * 6)) + 'h' : '…'
      bar.style.transform = `scaleX(${held})`
    },
    close() {
      box.classList.add('is-off')
      setTimeout(() => box.remove(), 900)
    },
  }
}
