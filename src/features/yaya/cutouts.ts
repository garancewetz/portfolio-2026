// Le détourage des maisons du village (voir scene.ts), fait une fois au chargement, pixel par pixel : on enlève
// la végétation autour (ce qui est vert), on garde les murs et les toits (beiges, orangés, gris).

function pixels(img: HTMLImageElement) {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  return { c, ctx, data: ctx.getImageData(0, 0, c.width, c.height) }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function house(img: HTMLImageElement) {
  const { c, ctx, data } = pixels(img)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    // (vert : le vert dépasse le rouge et le bleu ; et l'ombre sous les arbres, sombre et sans couleur chaude)
    const green = g - Math.max(r, b)
    const dark = (r + g + b) / 3 < 55 && r <= g + 6
    d[i + 3] = dark ? 0 : 255 * (1 - smooth(-4, 14, green))
  }
  ctx.putImageData(data, 0, 0)
  return c
}
