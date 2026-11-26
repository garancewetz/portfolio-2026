// In the home's window, at the very bottom of the abyss, the real page (the other windows keep their screenshot):
// an iframe, loaded on arrival (hidden), then laid exactly on the drawn page of its window: same size as the
// browser window (W × H), scaled down to the drawn window. The screenshot drawn below is only a placeholder.
// The wheel, over it, is for diving (dive); except at the very bottom, when the home fills the screen: then it
// scrolls, and, at the very top of the home, scrolling up brings you back out of the abyss.

// its place: top-left corner and on-screen scale, bottom rounding; and the hole where the next window sits
// (in page pixels: the page fades out there, to show the drawn window, its bar and its shadow)
export type Place = {
  left: number
  top: number
  scale: number
  r: number
  hole?: { x: number; y: number; w: number; h: number }
}

// (only the home is a real, living page: the lab pages, often heavy — 3D, fireworks —, stay as their
// screenshots, drawn in their windows)
const live = (path: string) => path === '/'   // (the home page itself, not a project page nor the lab: ?p=…, /lab/)

export function doors(main: HTMLElement, paths: string[], dive: (deltaY: number) => void, full: () => boolean) {
  const frames = paths.map((path, d) => {
    if (!live(path)) return null
    const frame = document.createElement('iframe')
    frame.className = 'ab-door'
    frame.src = path
    frame.title = path
    // (hidden, but at its size: a hidden page with no size would lay itself out for nothing)
    frame.style.visibility = 'hidden'
    frame.style.width = `${main.clientWidth}px`
    frame.style.height = `${main.clientHeight}px`
    const last = d === paths.length - 1
    frame.addEventListener('load', () => {
      frame.classList.add('is-ready')
      const inside = frame.contentWindow
      // (before the page itself: the wheel belongs to the abyss, not to the page — the murmuration, for instance, uses
      // it to move time forward)
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
    // each page's place on screen (null: not in view); W × H: the size of the browser window
    place(at: (Place | null)[], W: number, H: number) {
      frames.forEach((frame, d) => {
        if (!frame) return
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
