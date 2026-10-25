// Une photo en caractères : la photo couvre la fenêtre (agrandie jusqu'à la remplir, ce qui dépasse est coupé), et
// chaque case de la grille en prend la couleur moyenne.

// la rampe : du plus léger au plus dense (70 niveaux, la rampe classique de Paul Bourke)
export const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

export function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// le cadrage : la partie de la photo qui doit remplir la fenêtre (en pixels de la photo). Elle est agrandie
// jusqu'à couvrir toute la fenêtre, centrée ; renvoie, pour passer de la photo à l'écran : l'échelle et le décalage
export function cover(crop: [number, number, number, number], W: number, H: number) {
  const [x, y, w, h] = crop
  const scale = Math.max(W / w, H / h)
  const sx = x + w / 2 - W / scale / 2
  const sy = y + h / 2 - H / scale / 2
  return { scale, sx, sy, toX: (px: number) => (px - sx) * scale, toY: (py: number) => (py - sy) * scale }
}

// la couleur de chaque case (RVBA, rangée par rangée) : la photo réduite à une case par pixel
export function sample(img: HTMLImageElement, fit: ReturnType<typeof cover>, cols: number, rows: number, cw: number, ch: number) {
  const c = document.createElement('canvas')
  c.width = cols
  c.height = rows
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cols, rows)
  ctx.drawImage(img, fit.sx, fit.sy, (cols * cw) / fit.scale, (rows * ch) / fit.scale, 0, 0, cols, rows)
  return ctx.getImageData(0, 0, cols, rows).data
}
