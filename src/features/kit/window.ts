import { LOOKS } from './looks'
import { ROUTE, UNDER_WAY } from './route'
import { stage } from './stage'

// Kit's window: the ticket's four steps. A click on one shows the ticket there: the steps before it done (a tick, a
// button to look back), this one under way (in orange: how far, what is happening, the one main button), the steps
// after it still to come; the small Pousse beside the title changes outfit, and the ticket's state follows.

export function route(still: boolean) {
  const list = document.querySelector<HTMLElement>('.kit-steps')!
  const state = document.querySelector<HTMLElement>('.kit-state')!
  // (each step's outfit built once)
  const outfits = ROUTE.map((step) => LOOKS[step.look]())
  const mini = stage(document.querySelector<HTMLCanvasElement>('.kit-mini')!, outfits[UNDER_WAY], still)
  let shown = -1

  const items = ROUTE.map((step, i) => {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.addEventListener('click', () => show(i))
    item.append(button)
    list.append(item)
    return { step, button }
  })

  function show(now: number) {
    if (now === shown) return
    if (shown >= 0) mini.wear(outfits[now])
    shown = now
    items.forEach(({ step, button }, i) => {
      const done = i < now
      const under = i === now
      const n = String(i + 1).padStart(2, '0')
      const mark = done ? '<i>✓</i>' : under ? '<i>●</i>' : ''
      // (its pretend buttons are only drawn: a screen reader hears the step, where it stands, and how far)
      const drawn = (label: string, primary = false) => `<span class="kit-button${primary ? ' primary' : ''}" aria-hidden="true">${label}</span>`
      const tail = under
        ? `<span class="kit-bars" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i class="${k <= step.bars ? 'on' : ''}"></i>`).join('')}</span><span class="kit-progress">${step.progress}</span>${drawn(step.go, true)}`
        : done && step.back
          ? drawn(step.back)
          : !done && step.start
            ? drawn(step.start)
            : ''
      button.className = done ? 'done' : under ? 'now' : ''
      button.setAttribute('aria-pressed', String(under))
      const where = done ? 'faite' : under ? 'en cours' : 'à venir'
      button.innerHTML = `<span class="kit-n"><span aria-hidden="true">${n} ${mark}</span></span><b>${step.title}</b><span class="sr"> : ${where}</span>${tail}`
    })
    const last = now === ROUTE.length - 1
    state.textContent = last ? '● Livré' : '● En cours'
    state.classList.toggle('kit-mint', last)
  }
  show(UNDER_WAY)
}
