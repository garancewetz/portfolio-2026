// Les petites icônes des barres de navigateur, au trait (comme les vraies : des traits fins et arrondis), centrées
// sur (x, y). La couleur et l'épaisseur sont celles du contexte (strokeStyle, lineWidth).

type Ctx = CanvasRenderingContext2D

const line = (ctx: Ctx, pts: number[][]) => {
  ctx.beginPath()
  pts.forEach(([a, b], k) => (k ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
  ctx.stroke()
}

export const icons = {
  back(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x + 6, y], [x - 6, y]])
    line(ctx, [[x - 1, y - 5], [x - 6, y], [x - 1, y + 5]])
  },
  forward(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x - 6, y], [x + 6, y]])
    line(ctx, [[x + 1, y - 5], [x + 6, y], [x + 1, y + 5]])
  },
  chevronLeft(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x + 3, y - 7], [x - 3, y], [x + 3, y + 7]])
  },
  chevronRight(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x - 3, y - 7], [x + 3, y], [x - 3, y + 7]])
  },
  chevronDown(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x - 4, y - 2], [x, y + 2], [x + 4, y - 2]])
  },
  reload(ctx: Ctx, x: number, y: number) {
    ctx.beginPath()
    ctx.arc(x, y, 6, -Math.PI * 0.35, Math.PI * 1.45)
    ctx.stroke()
    line(ctx, [[x + 2, y - 7.5], [x + 5.5, y - 5], [x + 3, y - 1.5]])
  },
  plus(ctx: Ctx, x: number, y: number, r = 6) {
    line(ctx, [[x - r, y], [x + r, y]])
    line(ctx, [[x, y - r], [x, y + r]])
  },
  close(ctx: Ctx, x: number, y: number, r = 4) {
    line(ctx, [[x - r, y - r], [x + r, y + r]])
    line(ctx, [[x + r, y - r], [x - r, y + r]])
  },
  star(ctx: Ctx, x: number, y: number) {
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const r = k % 2 ? 3.2 : 7
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a))
    }
    ctx.closePath()
    ctx.stroke()
  },
  kebab(ctx: Ctx, x: number, y: number) {
    const fill = ctx.fillStyle
    ctx.fillStyle = ctx.strokeStyle
    for (const d of [-5, 0, 5]) {
      ctx.beginPath()
      ctx.arc(x, y + d, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = fill
  },
  menu(ctx: Ctx, x: number, y: number) {
    for (const d of [-5, 0, 5]) line(ctx, [[x - 7, y + d], [x + 7, y + d]])
  },
  // (les réglages du site, dans la barre d'adresse de Chrome : deux curseurs)
  tune(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x - 6, y - 3], [x + 6, y - 3]])
    line(ctx, [[x - 6, y + 3], [x + 6, y + 3]])
    ctx.beginPath()
    ctx.arc(x - 2, y - 3, 2, 0, Math.PI * 2)
    ctx.moveTo(x + 4, y + 3)
    ctx.arc(x + 2, y + 3, 2, 0, Math.PI * 2)
    ctx.stroke()
  },
  lock(ctx: Ctx, x: number, y: number) {
    ctx.beginPath()
    ctx.roundRect(x - 4.5, y - 1, 9, 7, 1.5)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y - 1, 3, Math.PI, 0)
    ctx.stroke()
  },
  sidebar(ctx: Ctx, x: number, y: number) {
    ctx.beginPath()
    ctx.roundRect(x - 9, y - 7, 18, 14, 3)
    ctx.stroke()
    line(ctx, [[x - 3, y - 7], [x - 3, y + 7]])
  },
  share(ctx: Ctx, x: number, y: number) {
    line(ctx, [[x - 4, y - 2], [x - 6, y - 2], [x - 6, y + 8], [x + 6, y + 8], [x + 6, y - 2], [x + 4, y - 2]])
    line(ctx, [[x, y + 3], [x, y - 9]])
    line(ctx, [[x - 3.5, y - 5.5], [x, y - 9], [x + 3.5, y - 5.5]])
  },
  tabs(ctx: Ctx, x: number, y: number) {
    ctx.beginPath()
    ctx.roundRect(x - 7, y - 4, 11, 11, 2)
    ctx.stroke()
    line(ctx, [[x - 3, y - 7], [x + 5, y - 7], [x + 7, y - 7], [x + 7, y + 3]])
  },
}
