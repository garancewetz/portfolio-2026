import './sheet.css'

// La feuille du carnet : l'élément `.carnet-sheet` de chaque page (voir sheet.css), sur tout l'écran. Les pages y
// prennent leur taille, et y ramènent la position de la souris.

const el = document.querySelector<HTMLElement>('.carnet-sheet')

// la feuille dans la fenêtre : où elle commence, et sa taille (en pixels CSS)
export function sheet() {
  const r = el?.getBoundingClientRect()
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: innerWidth, h: innerHeight }
}

// la souris, ou le doigt, sur la feuille (0, 0 : son coin en haut à gauche)
export function local(e: { clientX: number; clientY: number }) {
  const { x, y } = sheet()
  return { x: e.clientX - x, y: e.clientY - y }
}
