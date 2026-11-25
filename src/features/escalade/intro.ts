// The arrival: the little man is not there yet. The characters he is made of lie scattered at the bottom of the
// page, on one line: a string of signs with no meaning at all. At the first move (a key, a press), his body
// comes together at once (legs, body, arms), but his head stayed on the ground: he picks it up, his arm lifts
// it and puts it on his shoulders. He is formed (the real drawing then takes over, see main.ts).

const ORDER_SEED = [3, 0, 5, 2, 4, 1] // (always the same jumble: no chance of randomly landing on the right order)

export function intro(main: HTMLElement, man: HTMLElement, sprite: string[], at: () => { x: number; y: number }) {
  // his characters, and their place in the drawing (column, row)
  const chars = sprite.flatMap((line, row) => [...line].map((c, col) => ({ c, col, row })).filter((p) => p.c !== ' '))
  const layer = document.createElement('div')
  layer.className = 'es-loose'
  layer.setAttribute('aria-hidden', 'true')
  const spans = chars.map(({ c }) => Object.assign(document.createElement('span'), { textContent: c }))
  layer.append(...spans)
  main.append(layer)

  // the size of a character (the drawing is 3 characters by 4 lines)
  const cell = () => ({ w: man.offsetWidth / sprite[0].length, h: man.offsetHeight / sprite.length })
  // scattered: on the ground line, in the middle, out of order, a little spaced out
  const scatter = () => {
    const { x, y } = at()
    const { w, h } = cell()
    const order = chars.map((_, i) => ORDER_SEED[i % ORDER_SEED.length] + Math.floor(i / ORDER_SEED.length) * 6)
    const rank = [...order].sort((a, b) => a - b)
    spans.forEach((s, i) => {
      // (laid at once: only the gathering slides)
      s.style.transition = 'none'
      const k = rank.indexOf(order[i])
      s.style.transform = `translate(${x + (k - chars.length / 2 + 1.5) * w * 1.6}px, ${y + (sprite.length - 1) * h}px)`
    })
  }
  scatter()
  addEventListener('resize', scatter)

  const place = (i: number) => {
    const { x, y } = at()
    const { w, h } = cell()
    return `translate(${x + chars[i].col * w}px, ${y + chars[i].row * h}px)`
  }
  let formed = false
  let started = false
  // the head: his right arm rises (it becomes a /, higher), the head goes up with the hand, up to the
  // shoulders; then the arm comes back down, and the real drawing takes over
  function pickUp(head: number) {
    const { x, y } = at()
    const { w, h } = cell()
    const s = spans[head]
    const arm = chars.findIndex((p) => p.row === 2 && p.col === 2)
    const from = s.style.transform
    const to = place(head)
    const hand = `translate(${x + 2.6 * w}px, ${y + 1.2 * h}px)`
    s.style.transition = 'none'
    s.animate([{ transform: from }, { transform: hand, offset: 0.55 }, { transform: to }], {
      duration: 900,
      easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
    })
    s.style.transform = to
    if (arm >= 0) {
      const a = spans[arm]
      a.style.transition = 'transform 0.35s ease'
      a.textContent = '/'
      a.style.transform = `translate(${x + 2 * w}px, ${y + h}px)`
      setTimeout(() => {
        a.textContent = chars[arm].c
        a.style.transform = place(arm)
      }, 800)
    }
    setTimeout(() => {
      formed = true
      layer.remove()
    }, 1100)
  }

  return {
    get formed() {
      return formed
    },
    // the first move: the body comes together at once (legs, body, arms), the head rolls beside his feet; then he
    // picks it up
    start() {
      if (started) return
      started = true
      removeEventListener('resize', scatter)
      const head = chars.findIndex((p) => p.c === 'o')
      const { x, y } = at()
      const { w, h } = cell()
      spans.forEach((s, i) => {
        s.style.transition = 'transform 0.45s cubic-bezier(0.45, 0, 0.2, 1)'
        s.style.transform = i === head ? `translate(${x + 4.2 * w}px, ${y + (sprite.length - 1) * h}px)` : place(i)
      })
      setTimeout(() => pickUp(head), 450)
    },
    // he is already formed elsewhere (in another window): no jumble here any more
    dismiss() {
      formed = started = true
      removeEventListener('resize', scatter)
      layer.remove()
    },
  }
}
