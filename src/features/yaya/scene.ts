// Où est Yaya ? La scène (voir yaya.ts, qui la dessine). Un collage fait dans le train entre Nice et Paris, le 19
// septembre 2021 : le ciel, trois plans de montagnes, un village perché dont les maisons sont découpées une à une
// (et détourées, voir cutouts.ts), et des feuillages au premier plan, en blocs comme dans le collage d'origine.
// Un « Où est Charlie ? » : Yaya est cachée dans l'image. Quand on clique sur elle, on l'a trouvée ; elle s'efface
// et va se cacher à la cachette suivante (voir spots.ts) : sur le clocher, toute petite sur une colline, la tête qui
// dépasse d'un buisson, ou tout entière derrière un buisson ou l'église… On la compte ; trouvée dix fois, elle
// apparaît en grand, devant ; un clic sur elle et on recommence. Les morceaux du collage flottent un peu, lentement,
// comme des papiers posés sur l'eau, et s'écartent un peu sous la souris (voir push.ts) : il faut fouiller.

import { house } from './cutouts'
import { push, PUSH } from './push'
import { FEET, LAST, SPOTS, type Layout, type Rect } from './spots'

const SRC = '/carnet/yaya/'
type Picture = HTMLImageElement | HTMLCanvasElement
type Images = { sky: Picture; mountains: Picture[]; village: Picture[]; leaves: Picture[]; yaya: Picture }

// le village : la hauteur de chaque maison (en part de la hauteur du village) ; les feuillages : la hauteur de
// chacun (en part du premier plan)
const HOUSES = [0.4, 0.5, 0.6, 0.7, 1, 0.8]
const LEAVES = [1, 0.3, 0.5, 0.6, 1]
// les morceaux flottent : de combien (en pixels) les montagnes, les maisons et les feuillages
const DRIFT = { mountains: 2.5, houses: 1.8, leaves: 4 }
// quand on l'a trouvée : elle reste encore WAIT secondes, puis s'efface (en GONE secondes) pendant qu'elle apparaît
// ailleurs (en COME secondes, un peu après)
const WAIT = 0.12
const GONE = 0.3
const COME = 1.1
const LATE = 0.6
// (« Trouvée ! » reste écrit un peu plus longtemps, le temps de le lire : SAID secondes)
const SAID = 1.4
// une petite marge autour d'elle pour le clic (en pixels), sinon les toutes petites seraient introuvables
const PAD = 6

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = SRC + src
  })
}

// une image dans une boîte, comme un fond CSS : cover (elle remplit la boîte) ou contain (elle y tient), calée en
// haut ou en bas, centrée en largeur ; ce qui dépasse de la boîte est coupé
function drawIn(ctx: CanvasRenderingContext2D, img: Picture, box: Rect, fit: 'cover' | 'contain', at: 'top' | 'bottom') {
  const s = fit === 'cover' ? Math.max(box.w / img.width, box.h / img.height) : Math.min(box.w / img.width, box.h / img.height)
  const w = img.width * s
  const h = img.height * s
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  ctx.drawImage(img, box.x + (box.w - w) / 2, at === 'top' ? box.y : box.y + box.h - h, w, h)
  ctx.restore()
}

export function scene() {
  let images: Images | null = null
  const ready = Promise.all([
    load('sky.jpg'),
    Promise.all([1, 2, 3].map((k) => load(`mountains/mountain-${k}.jpg`))),
    Promise.all([1, 2, 3, 4, 5, 6].map((k) => load(`village/village-${k}.jpg`))),
    Promise.all([1, 2, 3, 4, 5].map((k) => load(`leaves/leaves-${k}.jpg`))),
    load('yaya-detouree.png'),
  ]).then(([sky, mountains, village, leaves, yaya]) => {
    images = { sky, mountains, village: village.map(house), leaves, yaya }
  })

  // la mise en page, pour une fenêtre W × H (comme dans le collage d'origine : chaque plan de montagne occupe le bas
  // du précédent, le village est posé sur le dernier, les feuillages couvrent le bas de l'écran)
  // (chaque morceau flotte à sa façon : deux lentes ondulations, avec un rythme et un départ à lui, n)
  function float(r: Rect, n: number, a: number): Rect {
    const t = clock
    const dx = a * Math.sin(t * (0.31 + 0.07 * (n % 5)) + n * 1.7)
    const dy = a * Math.sin(t * (0.23 + 0.05 * (n % 3)) + n * 2.9)
    return { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h }
  }
  function layout(W: number, H: number): Layout {
    // (un peu plus larges que l'écran, et les feuillages un peu plus bas, pour que rien ne se découvre en flottant)
    const M = DRIFT.leaves * 2
    const m1: Rect = { x: -M, y: H * 0.15, w: W + 2 * M, h: H * 0.85 }
    const m2: Rect = { x: -M, y: H - m1.h * 0.85, w: W + 2 * M, h: m1.h * 0.85 }
    const m3: Rect = { x: -M, y: H - m2.h * 0.9, w: W + 2 * M, h: m2.h * 0.9 }
    const vw = Math.min(480, W * 0.36)
    const vh = m3.h * 0.6
    const village = HOUSES.map((h, k) => ({ x: (W - vw) / 2 + (k * vw) / HOUSES.length, y: m3.y + vh * (1 - h), w: vw / HOUSES.length, h: vh * h }))
    const front = H * 0.6
    // (les feuillages se chevauchent un peu, pour qu'aucune fente ne s'ouvre entre eux)
    // (et ceux des bords dépassent de l'écran, pour qu'aucun bord ne se découvre quand la souris les pousse)
    const edge = (PUSH.leaves.x * W) / LEAVES.length
    const leaves = LEAVES.map((h, k) => {
      const r = { x: (k * W) / LEAVES.length - M / 2, y: H - front * h, w: W / LEAVES.length + M, h: front * h + M }
      if (k === 0) return { ...r, x: r.x - edge, w: r.w + edge }
      if (k === LEAVES.length - 1) return { ...r, w: r.w + edge }
      return r
    })
    return {
      m1: float(m1, 0, DRIFT.mountains),
      m2: float(m2, 1, DRIFT.mountains),
      m3: float(m3, 2, DRIFT.mountains),
      village: village.map((r, k) => float(r, 10 + k, DRIFT.houses)),
      leaves: leaves.map((r, k) => float(r, 20 + k, DRIFT.leaves)),
    }
  }

  // l'état : la souris, la lumière de chaque maison (qui change en douceur), où est Yaya (au début, la première
  // cachette), de quel côté elle regarde, et combien de fois on l'a trouvée
  let mouseX = -1
  let mouseY = -1
  let spot = 0
  let facing = Math.random() < 0.5 ? -1 : 1
  let score = 0
  // (d'où elle vient, depuis quand elle a bougé, et quand on l'a trouvée)
  let was = spot
  let wasFacing = 1
  let since = 99
  let found: number | null = null
  let clock = 0
  const glow = HOUSES.map(() => 0)
  // (et elle, qui brille un peu quand la souris passe sur elle, pour donner envie de cliquer)
  let lit = 0
  let size = { W: 1, H: 1 }

  const inside = (r: Rect, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
  const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
  // à la cachette suivante (après la fin, on recommence)
  function next() {
    was = spot
    wasFacing = facing
    since = 0
    spot = spot === LAST ? 0 : spot + 1
    facing = Math.random() < 0.5 ? -1 : 1
    if (spot === 0) score = 0
  }
  // les morceaux, poussés par la souris (Yaya, elle, ne bouge pas avec eux : elle se découvre)
  const pushed = push(HOUSES.length, LEAVES.length)
  // sa boîte à l'écran, pour une place donnée : posée sur un morceau, elle bouge avec lui quand la souris le pousse ;
  // cachée derrière, elle reste là (L : les morceaux sans la souris, S : poussés)
  function box(k: number, L: Layout, S: Layout) {
    const still = SPOTS[k](size.W, size.H, L)
    const at = still.under !== undefined || still.behind !== undefined ? still : SPOTS[k](size.W, size.H, S)
    const h = size.H * at.tall
    const w = h * (images ? images.yaya.width / images.yaya.height : 0.29)
    return { at, x: at.x - w / 2, y: at.y - h * FEET, w, h }
  }
  // a-t-on cliqué sur elle ? (dans sa boîte, un peu élargie, mais pas sur ce qui la cache)
  function hit(x: number, y: number) {
    const L = layout(size.W, size.H)
    const S = pushed.apply(L)
    const b = box(spot, L, S)
    if (x < b.x - PAD || x > b.x + b.w + PAD || y < b.y - PAD || y > b.y + b.h + PAD) return false
    const { under, behind } = b.at
    if (typeof under === 'number' && inside(S.leaves[under], x, y)) return false
    if (behind !== undefined && inside(S.village[behind], x, y)) return false
    return true
  }

  return {
    ready,
    // (la souris est-elle sur elle ? la page montre alors une main)
    over: () => lit > 0.5,
    // le texte sous le carnet : « Trouvée ! » jusqu'à ce qu'elle se soit effacée, et le compte ; à la fin, coucou
    caption: () => {
      if (spot === LAST) return 'Coucou !'
      const just = found !== null || (since < SAID && was !== LAST)
      return `${just ? 'Trouvée !' : 'Où est Yaya ?'}  ${score}/${LAST}`
    },
    pointer(x: number, y: number) {
      mouseX = x
      mouseY = y
    },
    // un clic : si c'est sur elle (et qu'elle est bien là), on l'a trouvée
    click(x: number, y: number) {
      if (found !== null || since < LATE + COME) return false
      if (!hit(x, y)) return false
      found = clock
      if (spot !== LAST) score++
      return true
    },
    // avancer le temps (le collage flotte : la page redessine à chaque image)
    tick(dt: number) {
      const L = layout(size.W, size.H)
      const ease = 1 - Math.exp(-dt * 5)
      clock += dt
      since += dt
      // (trouvée : un instant après, elle file se cacher ailleurs)
      if (found !== null && clock - found > WAIT) {
        next()
        found = null
      }
      pushed.update(L, size.H, mouseX, mouseY, dt)
      const over = found === null && since > LATE + COME && hit(mouseX, mouseY)
      lit += ((over ? 1 : 0) - lit) * ease
      HOUSES.forEach((_, k) => {
        const t = inside(L.village[k], mouseX, mouseY) ? 1 : 0
        glow[k] += (t - glow[k]) * ease
      })
    },
    // dessiner la scène dans ctx, pour une fenêtre W × H
    draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
      size = { W, H }
      if (!images) return
      // (Yaya se place selon les morceaux là où ils flottent ; on les dessine poussés par la souris)
      const L = layout(W, H)
      const S = pushed.apply(L)
      const { sky, mountains, village, leaves, yaya } = images
      // Yaya à une place donnée, avec une transparence (quand elle s'efface ou apparaît)
      const yayaAt = (k: number, side: number, alpha: number) => {
        if (alpha <= 0.01) return
        const b = box(k, L, S)
        ctx.save()
        ctx.globalAlpha = alpha
        // (sous la souris : un peu plus claire, avec un halo doré autour)
        const l = k === spot ? lit : 0
        if (l > 0.01) ctx.filter = `brightness(${1 + 0.35 * l}) drop-shadow(0 0 ${Math.max(3, b.h * 0.06) * l}px rgb(255 236 170 / ${0.9 * l}))`
        ctx.translate(b.at.x, 0)
        ctx.scale(side, 1)
        ctx.drawImage(yaya, -b.w / 2, b.y, b.w, b.h)
        ctx.restore()
      }
      // (là où elle est, et là d'où elle part, chacune juste avant ce qui la cache)
      const shown: [number, number, number][] = [
        [was, wasFacing, 1 - smooth(since / GONE)],
        [spot, facing, smooth((since - LATE) / COME)],
      ]
      const yayasUnder = (u: number | 'village' | undefined) =>
        shown.forEach(([k, side, alpha]) => SPOTS[k](W, H, L).under === u && yayaAt(k, side, alpha))
      drawIn(ctx, sky, { x: 0, y: 0, w: W, h: H }, 'cover', 'top')
      drawIn(ctx, mountains[0], S.m1, 'contain', 'top')
      drawIn(ctx, mountains[1], S.m2, 'contain', 'top')
      drawIn(ctx, mountains[2], S.m3, 'cover', 'top')
      yayasUnder('village')
      // les maisons (un peu plus claires sous la souris)
      S.village.forEach((r, k) => {
        ctx.filter = glow[k] > 0.01 ? `brightness(${1 + 0.3 * glow[k]})` : 'none'
        drawIn(ctx, village[k], r, 'cover', 'top')
      })
      ctx.filter = 'none'
      S.leaves.forEach((r, k) => {
        yayasUnder(k)
        drawIn(ctx, leaves[k], r, 'cover', 'bottom')
      })
      yayasUnder(undefined)
    },
  }
}
