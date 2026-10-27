// Dans chaque fenêtre de l'abyme, la vraie page : une iframe par page du chemin, chargées dès l'arrivée (cachées),
// puis posées exactement sur la page dessinée de leur fenêtre : même taille que la fenêtre du navigateur (W × H),
// réduites à l'échelle de la fenêtre dessinée. Les captures dessinées dessous ne servent qu'en attendant.
// La molette, au-dessus d'elles, sert à plonger (dive) ; sauf tout au fond, quand l'accueil remplit l'écran :
// c'est lui qui défile, et, tout en haut de l'accueil, remonter fait ressortir de l'abyme.

// sa place : coin haut gauche et échelle à l'écran, arrondi du bas ; et le trou où se pose la fenêtre suivante
// (en pixels de la page : la page s'y efface, pour laisser voir la fenêtre dessinée, sa barre et son ombre)
export type Place = {
  left: number
  top: number
  scale: number
  r: number
  hole?: { x: number; y: number; w: number; h: number }
}

export function doors(main: HTMLElement, paths: string[], dive: (deltaY: number) => void, full: () => boolean) {
  const frames = paths.map((path, d) => {
    const frame = document.createElement('iframe')
    frame.className = 'ab-door'
    frame.src = path
    frame.title = path
    // (cachée, mais à sa taille : une page cachée sans taille se mettrait en page pour rien)
    frame.style.visibility = 'hidden'
    frame.style.width = `${main.clientWidth}px`
    frame.style.height = `${main.clientHeight}px`
    const last = d === paths.length - 1
    frame.addEventListener('load', () => {
      frame.classList.add('is-ready')
      const inside = frame.contentWindow
      // (avant la page elle-même : la molette est à l'abyme, pas à la page — la murmuration, par exemple, s'en
      // sert pour avancer le temps)
      inside?.addEventListener(
        'wheel',
        (e) => {
          if (e.ctrlKey) return
          const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
          if (last && full() && !(delta < 0 && inside.scrollY <= 0)) return
          e.preventDefault()
          e.stopImmediatePropagation()
          dive(delta)
        },
        { passive: false, capture: true },
      )
    })
    main.append(frame)
    return frame
  })
  return {
    // la place de chaque page à l'écran (null : pas en vue) ; W × H : la taille de la fenêtre du navigateur
    place(at: (Place | null)[], W: number, H: number) {
      frames.forEach((frame, d) => {
        const p = at[d]
        frame.style.visibility = p ? '' : 'hidden'
        if (!p) return
        frame.style.width = `${W}px`
        frame.style.height = `${H}px`
        frame.style.transform = `translate(${p.left}px, ${p.top}px) scale(${p.scale})`
        frame.style.borderRadius = `0 0 ${p.r / p.scale}px ${p.r / p.scale}px`
        const o = p.hole
        frame.style.clipPath = o ? `path(evenodd, "M0 0H${W}V${H}H0Z M${o.x} ${o.y}h${o.w}v${o.h}h${-o.w}Z")` : ''
      })
    },
  }
}
