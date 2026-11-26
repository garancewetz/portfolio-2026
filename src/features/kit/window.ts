import { LOOKS } from './looks'
import { ROUTE, UNDER_WAY } from './route'
import { stage } from './stage'

// Kit's window: the ticket's five steps. A click on one shows the ticket there: the steps before it done (a tick, a
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
      const tail = under
        ? `<span class="kit-bars">${[1, 2, 3, 4].map((k) => `<i class="${k <= step.bars ? 'on' : ''}"></i>`).join('')}</span><span class="kit-progress">${step.progress}</span><span class="kit-button primary">${step.go}</span>`
        : done && step.back
          ? `<span class="kit-button">${step.back}</span>`
          : !done && step.start
            ? `<span class="kit-button">${step.start}</span>`
            : ''
      button.className = done ? 'done' : under ? 'now' : ''
      button.setAttribute('aria-pressed', String(under))
      // (its name: the step and where it stands, not the words of its pretend buttons)
      button.setAttribute('aria-label', `Étape ${i + 1}, ${step.title} : ${done ? 'faite' : under ? `en cours, ${step.progress}` : 'à venir'}`)
      button.innerHTML = `<span class="kit-n">${n} ${mark}</span><b>${step.title}</b>${tail}`
    })
    const last = now === ROUTE.length - 1
    state.textContent = last ? '● Livré' : '● En cours'
    state.classList.toggle('kit-mint', last)
  }
  show(UNDER_WAY)
}
