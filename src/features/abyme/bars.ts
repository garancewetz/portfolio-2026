import type { Kind, Look } from './browser'
import { icons } from './icons'

// La barre du haut de chaque navigateur, au plus près des vraies (en pixels de la page, à la taille réelle) :
// Chrome, Edge et Brave (une rangée d'onglets, puis la barre d'outils et sa barre d'adresse arrondie), Firefox
// (l'onglet posé comme une carte), Safari (une seule barre, le champ d'adresse au milieu). La page dessine
// ensuite son contenu dessous.

type Ctx = CanvasRenderingContext2D
export type Info = { title: string; host: string; path: string; mac: boolean; favicon: HTMLImageElement | null }

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

export const barHeight = (kind: Kind) => (kind === 'safari' ? 52 : kind === 'firefox' ? 80 : 82)

function lights(ctx: Ctx, x: number, y: number) {
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(x + 20 + k * 20, y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgb(0 0 0 / 0.12)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  })
}
// (Windows : réduire, agrandir, fermer, à droite)
function controls(ctx: Ctx, x: number, y: number, w: number, L: Look) {
  ctx.strokeStyle = L.text
  ctx.lineWidth = 1
  const cx = x + w - 23
  icons.close(ctx, cx, y, 5)
  ctx.strokeRect(cx - 46 - 5, y - 5, 10, 10)
  ctx.beginPath()
  ctx.moveTo(cx - 92 - 5, y)
  ctx.lineTo(cx - 92 + 5, y)
  ctx.stroke()
}
function favicon(ctx: Ctx, info: Info, x: number, y: number, L: Look) {
  if (info.favicon?.complete && info.favicon.naturalWidth) ctx.drawImage(info.favicon, x - 8, y - 8, 16, 16)
  else {
    ctx.fillStyle = L.faint
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
  }
}
function text(ctx: Ctx, s: string, x: number, y: number, color: string, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color
  ctx.font = `${size}px ${SANS}`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}
// le titre de l'onglet, coupé au bord (en fondu, comme Chrome)
function title(ctx: Ctx, info: Info, x: number, y: number, w: number, L: Look) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y - 10, w, 20)
  ctx.clip()
  text(ctx, info.title, x, y, L.text)
  ctx.restore()
}
function url(ctx: Ctx, info: Info, x: number, y: number, L: Look) {
  text(ctx, info.host, x, y, L.text, 14)
  const hw = ctx.measureText(info.host).width
  text(ctx, info.path, x + hw, y, L.faint, 14)
}

// Chrome, Edge, Brave
function chromium(ctx: Ctx, x: number, y: number, w: number, L: Look, info: Info) {
  const S = 41
  ctx.fillStyle = L.strip
  ctx.fillRect(x, y, w, S)
  if (info.mac) lights(ctx, x, y + S / 2)
  else controls(ctx, x, y + S / 2, w, L)
  // l'onglet ouvert : coins arrondis en haut, et ses « pieds » qui s'évasent dans la barre d'outils
  const tx = x + (info.mac ? 82 : 10)
  const tw = Math.min(256, Math.max(120, w * 0.22))
  const top = y + 8
  const r = 8
  ctx.fillStyle = L.tab
  ctx.beginPath()
  ctx.moveTo(tx - r, y + S)
  ctx.arcTo(tx, y + S, tx, y + S - r, r)
  ctx.arcTo(tx, top, tx + r, top, r)
  ctx.arcTo(tx + tw, top, tx + tw, top + r, r)
  ctx.arcTo(tx + tw, y + S, tx + tw + r, y + S, r)
  ctx.closePath()
  ctx.fill()
  favicon(ctx, info, tx + 18, top + 16, L)
  title(ctx, info, tx + 34, top + 16, tw - 64, L)
  ctx.strokeStyle = L.text
  ctx.lineWidth = 1.2
  icons.close(ctx, tx + tw - 16, top + 16, 3.5)
  ctx.strokeStyle = L.faint
  ctx.lineWidth = 1.4
  icons.plus(ctx, tx + tw + 22, top + 16, 6)
  if (info.mac) icons.chevronDown(ctx, x + w - 22, y + S / 2)
  // la barre d'outils
  const B = y + S
  ctx.fillStyle = L.bar
  ctx.fillRect(x, B, w, 41)
  const cy = B + 20
  ctx.strokeStyle = L.text
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  icons.back(ctx, x + 22, cy)
  ctx.strokeStyle = L.faint
  icons.forward(ctx, x + 56, cy)
  ctx.strokeStyle = L.text
  icons.reload(ctx, x + 90, cy)
  const ox = x + 116
  const ow = w - 116 - 84
  ctx.fillStyle = L.field
  ctx.beginPath()
  ctx.roundRect(ox, cy - 17, ow, 34, 17)
  ctx.fill()
  ctx.lineWidth = 1.3
  icons.tune(ctx, ox + 20, cy)
  url(ctx, info, ox + 40, cy, L)
  ctx.lineWidth = 1.4
  icons.star(ctx, ox + ow - 20, cy)
  // le profil (une pastille), et le menu
  ctx.fillStyle = '#8ab4f8'
  ctx.beginPath()
  ctx.arc(x + w - 58, cy, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = L.text
  icons.kebab(ctx, x + w - 24, cy)
  ctx.fillStyle = 'rgb(0 0 0 / 0.08)'
  ctx.fillRect(x, y + barHeight('chrome') - 1, w, 1)
}

function firefox(ctx: Ctx, x: number, y: number, w: number, L: Look, info: Info) {
  const S = 40
  ctx.fillStyle = L.strip
  ctx.fillRect(x, y, w, S)
  if (info.mac) lights(ctx, x, y + S / 2)
  else controls(ctx, x, y + S / 2, w, L)
  // l'onglet : une carte posée, avec une ombre
  const tx = x + (info.mac ? 82 : 8)
  const tw = Math.min(240, Math.max(120, w * 0.22))
  ctx.save()
  ctx.shadowColor = 'rgb(0 0 0 / 0.15)'
  ctx.shadowBlur = 4
  ctx.fillStyle = L.tab
  ctx.beginPath()
  ctx.roundRect(tx, y + 5, tw, S - 10, 4)
  ctx.fill()
  ctx.restore()
  favicon(ctx, info, tx + 16, y + S / 2, L)
  title(ctx, info, tx + 32, y + S / 2, tw - 58, L)
  ctx.strokeStyle = L.text
  ctx.lineWidth = 1.2
  icons.close(ctx, tx + tw - 14, y + S / 2, 3.5)
  icons.plus(ctx, tx + tw + 20, y + S / 2, 6)
  const B = y + S
  ctx.fillStyle = L.bar
  ctx.fillRect(x, B, w, 40)
  const cy = B + 20
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  icons.back(ctx, x + 22, cy)
  ctx.strokeStyle = L.faint
  icons.forward(ctx, x + 54, cy)
  ctx.strokeStyle = L.text
  icons.reload(ctx, x + 86, cy)
  const ox = x + 110
  const ow = w - 110 - 50
  ctx.fillStyle = L.field
  ctx.beginPath()
  ctx.roundRect(ox, cy - 15, ow, 30, 4)
  ctx.fill()
  ctx.lineWidth = 1.3
  icons.lock(ctx, ox + 18, cy)
  url(ctx, info, ox + 34, cy, L)
  ctx.lineWidth = 1.4
  icons.star(ctx, ox + ow - 18, cy)
  icons.menu(ctx, x + w - 24, cy)
  ctx.fillStyle = 'rgb(0 0 0 / 0.08)'
  ctx.fillRect(x, y + barHeight('firefox') - 1, w, 1)
}

function safari(ctx: Ctx, x: number, y: number, w: number, L: Look, info: Info) {
  const S = barHeight('safari')
  const cy = y + S / 2
  ctx.fillStyle = L.bar
  ctx.fillRect(x, y, w, S)
  lights(ctx, x, cy)
  ctx.strokeStyle = L.faint
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  icons.sidebar(ctx, x + 100, cy)
  icons.chevronLeft(ctx, x + 140, cy)
  icons.chevronRight(ctx, x + 166, cy)
  // le champ d'adresse, au milieu : le cadenas et le nom du site
  const fw = Math.min(w * 0.42, 600)
  ctx.fillStyle = L.field
  ctx.beginPath()
  ctx.roundRect(x + (w - fw) / 2, cy - 17, fw, 34, 9)
  ctx.fill()
  ctx.font = `14px ${SANS}`
  const tw = ctx.measureText(info.host).width
  ctx.strokeStyle = L.text
  ctx.lineWidth = 1.2
  icons.lock(ctx, x + w / 2 - tw / 2 - 12, cy)
  text(ctx, info.host, x + w / 2 + 6, cy, L.text, 14, 'center')
  ctx.strokeStyle = L.faint
  ctx.lineWidth = 1.6
  icons.share(ctx, x + w - 100, cy)
  icons.plus(ctx, x + w - 62, cy, 7)
  icons.tabs(ctx, x + w - 26, cy)
  ctx.fillStyle = 'rgb(0 0 0 / 0.1)'
  ctx.fillRect(x, y + S - 1, w, 1)
}

export function bar(kind: Kind) {
  return kind === 'safari' ? safari : kind === 'firefox' ? firefox : chromium
}
