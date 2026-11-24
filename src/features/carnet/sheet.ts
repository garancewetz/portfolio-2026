import './sheet.css'

// The notebook sheet: each page's `.carnet-sheet` element (see sheet.css), over the whole screen. Pages take
// their size from it, and bring the mouse position back to it.

const el = document.querySelector<HTMLElement>('.carnet-sheet')

// the sheet in the window: where it starts, and its size (in CSS pixels)
export function sheet() {
  const r = el?.getBoundingClientRect()
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: innerWidth, h: innerHeight }
}

// the mouse, or the finger, on the sheet (0, 0: its top-left corner)
export function local(e: { clientX: number; clientY: number }) {
  const { x, y } = sheet()
  return { x: e.clientX - x, y: e.clientY - y }
}
