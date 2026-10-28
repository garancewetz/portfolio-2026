// L'arrivée : le bonhomme n'est pas encore là. Les caractères qui le composent traînent en bas de la page, en
// vrac, sur une ligne : une suite de signes sans aucun sens. Au premier geste (une touche, un appui), son corps se
// rassemble d'un coup (les jambes, le corps, les bras), mais sa tête est restée par terre : il la ramasse, son bras
// la monte et la pose sur ses épaules. Il est formé (le vrai dessin prend alors le relais, voir main.ts).

const ORDER_SEED = [3, 0, 5, 2, 4, 1] // (un vrac toujours le même : pas de hasard qui tomberait sur le bon ordre)

export function intro(main: HTMLElement, man: HTMLElement, sprite: string[], at: () => { x: number; y: number }) {
  // ses caractères, et leur place dans le dessin (colonne, ligne)
  const chars = sprite.flatMap((line, row) => [...line].map((c, col) => ({ c, col, row })).filter((p) => p.c !== ' '))
  const layer = document.createElement('div')
  layer.className = 'es-loose'
  layer.setAttribute('aria-hidden', 'true')
  const spans = chars.map(({ c }) => Object.assign(document.createElement('span'), { textContent: c }))
  layer.append(...spans)
  main.append(layer)

  // la taille d'un caractère (le dessin fait 3 caractères sur 4 lignes)
  const cell = () => ({ w: man.offsetWidth / sprite[0].length, h: man.offsetHeight / sprite.length })
  // en vrac : sur la ligne du sol, au milieu, dans le désordre, un peu espacés
  const scatter = () => {
    const { x, y } = at()
    const { w, h } = cell()
    const order = chars.map((_, i) => ORDER_SEED[i % ORDER_SEED.length] + Math.floor(i / ORDER_SEED.length) * 6)
    const rank = [...order].sort((a, b) => a - b)
    spans.forEach((s, i) => {
      // (posés d'un coup : seul le rassemblement glisse)
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
  // la tête : son bras droit se lève (il devient un /, plus haut), la tête monte avec la main, jusqu'aux
  // épaules ; puis le bras redescend, et le vrai dessin prend le relais
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
    // le premier geste : le corps se rassemble d'un coup (les jambes, le corps, les bras), la tête roule à côté de
    // ses pieds ; puis il la ramasse
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
    // il est déjà formé ailleurs (dans une autre fenêtre) : plus de vrac ici
    dismiss() {
      formed = started = true
      removeEventListener('resize', scatter)
      layer.remove()
    },
  }
}
