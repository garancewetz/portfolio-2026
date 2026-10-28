// Le carnet ouvert (la page /labo/) : deux pages côte à côte. Un clic sur la page de droite (ou →) la tourne : elle
// pivote autour de la reliure et se pose à gauche, son verso est la page suivante ; sous elle, la page d'après
// était déjà là. Un clic sur la page de gauche (ou ←) revient en arrière. Sur un téléphone, une page à la fois :
// la suivante arrive en fondu. Les liens d'une page (la capture, le nom) ouvrent l'expérience, sans tourner.

const TURN = 900 // la durée d'une page qui tourne (ms)
const EASE = 'cubic-bezier(0.45, 0, 0.2, 1)'
const narrow = matchMedia('(max-width: 760px)')
const still = matchMedia('(prefers-reduced-motion: reduce)')

export function book(el: HTMLElement, count: number, page: (i: number) => string) {
  el.innerHTML = `
    <section class="sm-page sm-left" aria-live="polite"></section>
    <section class="sm-page sm-right" aria-live="polite"></section>
    <div class="sm-leaf" hidden><div class="sm-page sm-front"></div><div class="sm-page sm-back"></div></div>`
  const [left, right, front, back] = ['.sm-left', '.sm-right', '.sm-front', '.sm-back'].map((s) =>
    el.querySelector<HTMLElement>(s)!,
  )
  const leaf = el.querySelector<HTMLElement>('.sm-leaf')!
  const fill = (side: HTMLElement, i: number) => {
    side.innerHTML = i >= 0 && i < count ? page(i) : page(-1)
    // (les pages paires à gauche, les impaires à droite : le numéro et le coin se posent du côté du bord)
    side.dataset.side = i % 2 ? 'right' : 'left'
  }

  // la première page montrée (à gauche ; sur un téléphone, la seule)
  let at = 0
  let busy = false
  const per = () => (narrow.matches ? 1 : 2)
  const draw = () => {
    fill(left, at)
    fill(right, at + 1)
    el.classList.toggle('is-first', at === 0)
    el.classList.toggle('is-last', at + per() >= count)
  }

  // tourner : dir 1, vers les pages suivantes ; -1, vers les précédentes
  async function turn(dir: 1 | -1) {
    const to = at + dir * per()
    if (busy || to < 0 || to >= count) return
    if (still.matches || per() === 1) {
      at = to
      if (!still.matches) await fade()
      return draw()
    }
    busy = true
    // la feuille qui tourne : recto (la page qu'on quitte), verso (celle qui arrive de l'autre côté) ; dessous,
    // la page d'après est déjà en place
    const forward = dir === 1
    fill(front, forward ? at + 1 : at)
    fill(back, forward ? at + 2 : at - 1)
    fill(forward ? right : left, forward ? at + 3 : at - 2)
    leaf.hidden = false
    leaf.classList.toggle('is-back', !forward)
    await leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${forward ? -180 : 180}deg)` }], {
      duration: TURN,
      easing: EASE,
    }).finished
    at = to
    draw()
    leaf.hidden = true
    busy = false
  }

  // (téléphone : la page s'efface, la suivante apparaît)
  async function fade() {
    await left.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished
    draw()
    left.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 })
  }

  // un clic sur une page la tourne (pas sur ses liens) ; sur un téléphone, la page seule tourne vers la suivante
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('a')) return
    if (t.closest('.sm-right') || (per() === 1 && t.closest('.sm-left'))) turn(1)
    else if (t.closest('.sm-left')) turn(-1)
  })
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') turn(1)
    else if (e.key === 'ArrowLeft') turn(-1)
  })
  // (en passant du téléphone au grand écran : on repart d'une page de gauche)
  narrow.addEventListener('change', () => {
    at -= at % per()
    draw()
  })

  draw()
}
