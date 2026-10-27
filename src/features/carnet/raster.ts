// Une grille de caractères très dense, dessinée vite : chaque caractère est rendu une seule fois (son empreinte, en
// pixels de l'écran), puis on recopie ces empreintes dans une image, case par case, avec leur couleur. Des dizaines
// de milliers de cases tiennent ainsi dans une image ; écrire chaque caractère avec fillText serait trop lent.
// Les cases ne se chevauchent pas : chaque pixel appartient à une seule case, on l'écrit sans mélange.

export type Raster = ReturnType<typeof raster>

import { sheet } from './sheet'

export function raster(canvas: HTMLCanvasElement, glyphs: string, size: () => number, lineHeight = 1.15) {
  const ctx = canvas.getContext('2d')!
  const off = document.createElement('canvas')
  const offCtx = off.getContext('2d')!
  const r = {
    W: 0, // (en pixels CSS)
    H: 0,
    cw: 0, // la largeur et la hauteur d'une case (en pixels CSS)
    ch: 0,
    cols: 0,
    rows: 0,
    image: new ImageData(1, 1),
    // l'empreinte de chaque caractère : son opacité (0 à 255) pour chaque pixel de la case
    masks: [] as Uint8Array[],
    dw: 0, // la case en pixels de l'écran
    dh: 0,
    resize() {
      const dpr = Math.min(2, devicePixelRatio || 1)
      // (la grille couvre la feuille du carnet : voir sheet.ts)
      ;({ w: r.W, h: r.H } = sheet())
      const px = size()
      const font = `${px * dpr}px 'JetBrains Mono', ui-monospace, monospace`
      offCtx.font = font
      r.dw = Math.max(1, Math.round(offCtx.measureText('M').width))
      r.dh = Math.max(1, Math.round(px * lineHeight * dpr))
      r.cw = r.dw / dpr
      r.ch = r.dh / dpr
      // (au moins une case : une page encore sans taille, cachée, ne plante pas)
      r.cols = Math.max(1, Math.ceil((r.W * dpr) / r.dw))
      r.rows = Math.max(1, Math.ceil((r.H * dpr) / r.dh))
      canvas.width = r.cols * r.dw
      canvas.height = r.rows * r.dh
      canvas.style.width = `${(r.cols * r.dw) / dpr}px`
      canvas.style.height = `${(r.rows * r.dh) / dpr}px`
      off.width = canvas.width
      off.height = canvas.height
      r.image = new ImageData(canvas.width, canvas.height)
      // les empreintes : chaque caractère dessiné en blanc dans une case, puis son opacité relevée
      const g = document.createElement('canvas')
      g.width = r.dw
      g.height = r.dh
      const gc = g.getContext('2d', { willReadFrequently: true })!
      gc.font = font
      gc.textBaseline = 'middle'
      gc.fillStyle = '#fff'
      r.masks = [...glyphs].map((char) => {
        gc.clearRect(0, 0, r.dw, r.dh)
        gc.fillText(char, 0, r.dh / 2)
        const data = gc.getImageData(0, 0, r.dw, r.dh).data
        const mask = new Uint8Array(r.dw * r.dh)
        for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3]
        return mask
      })
    },
    // tout effacer (transparent)
    clear() {
      r.image.data.fill(0)
    },
    // le caractère n° glyph dans la case (c, row), d'une couleur et d'une opacité (0 à 1) ; -1 : case vide
    put(c: number, row: number, glyph: number, red: number, green: number, blue: number, alpha = 1) {
      if (c < 0 || row < 0 || c >= r.cols || row >= r.rows) return
      const data = r.image.data
      const width = r.image.width
      const x0 = c * r.dw
      const y0 = row * r.dh
      if (glyph < 0) {
        for (let y = 0; y < r.dh; y++) data.fill(0, ((y0 + y) * width + x0) * 4, ((y0 + y) * width + x0 + r.dw) * 4)
        return
      }
      const mask = r.masks[glyph]
      for (let y = 0; y < r.dh; y++) {
        let p = ((y0 + y) * width + x0) * 4
        let m = y * r.dw
        for (let x = 0; x < r.dw; x++, p += 4, m++) {
          data[p] = red
          data[p + 1] = green
          data[p + 2] = blue
          data[p + 3] = mask[m] * alpha
        }
      }
    },
    // afficher l'image ; under : ce qu'on peint dessous d'abord (un fond, un dégradé), en pixels de l'écran
    flush(under?: (ctx: CanvasRenderingContext2D) => void) {
      if (!under) return ctx.putImageData(r.image, 0, 0)
      offCtx.putImageData(r.image, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      under(ctx)
      ctx.drawImage(off, 0, 0)
    },
  }
  return r
}

// une couleur CSS « rgb(r g b) » ou « hsl(h s% l%) » en trois nombres (pour les tables toutes prêtes)
const probe = document.createElement('canvas').getContext('2d')!
export function rgbOf(css: string): [number, number, number] {
  probe.fillStyle = css
  const hex = probe.fillStyle as string
  if (hex.startsWith('#')) return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
  const m = hex.match(/[\d.]+/g)!.map(Number)
  return [m[0], m[1], m[2]]
}
