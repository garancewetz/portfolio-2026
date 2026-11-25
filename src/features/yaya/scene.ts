// Où est Yaya ? The scene (see yaya.ts, which draws it). A collage made on the train between Nice and Paris, on
// 19 September 2021: the sky, three layers of mountains, a hilltop village whose houses are cut out one by one
// (and trimmed, see cutouts.ts), and foliage in the foreground, in blocks as in the original collage.
// A « Où est Charlie ? »: Yaya is hidden in the picture. When you click on her, you have found her; she fades
// and goes to hide in the next hiding place (see spots.ts): on the bell tower, tiny on a hill, her head peeking
// out of a bush, or entirely behind a bush or the church… She is counted; found ten times, she appears large, in
// front; a click on her and it starts again. The collage is still, like a notebook page; its pieces move aside
// a little under the mouse (see push.ts): you have to search.

import { house } from './cutouts'
import { push, PUSH } from './push'
import { FEET, LAST, SPOTS, type Layout, type Rect } from './spots'

const SRC = '/carnet/yaya/'
type Picture = HTMLImageElement | HTMLCanvasElement
type Images = { sky: Picture; mountains: Picture[]; village: Picture[]; leaves: Picture[]; yaya: Picture }

// the village: each house's height (as a share of the village height); the foliage: each one's height (as a
// share of the foreground)
const HOUSES = [0.4, 0.5, 0.6, 0.7, 1, 0.8]
const LEAVES = [1, 0.3, 0.5, 0.6, 1]
// once found: she stays WAIT more seconds, then fades (over GONE seconds) while she appears elsewhere (over
// COME seconds, a bit later)
const WAIT = 0.12
const GONE = 0.3
const COME = 1.1
const LATE = 0.6
// (« Trouvée ! » stays written a little longer, time to read it: SAID seconds)
const SAID = 1.4
// a small margin around her for the click (in pixels), otherwise the tiny ones would be impossible to find
const PAD = 6

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = SRC + src
  })
}

// an image in a box, like a CSS background: cover (it fills the box) or contain (it fits in it), aligned to the
// top or the bottom, centred horizontally; whatever overflows the box is cut
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

  // the layout, for a W × H window (as in the original collage: each mountain layer takes up the bottom of the
  // previous one, the village sits on the last, the foliage covers the bottom of the screen)
  function layout(W: number, H: number): Layout {
    // (a little wider than the screen, and the foliage a little lower, so that no edge is uncovered)
    const M = 8
    const m1: Rect = { x: -M, y: H * 0.15, w: W + 2 * M, h: H * 0.85 }
    const m2: Rect = { x: -M, y: H - m1.h * 0.85, w: W + 2 * M, h: m1.h * 0.85 }
    const m3: Rect = { x: -M, y: H - m2.h * 0.9, w: W + 2 * M, h: m2.h * 0.9 }
    const vw = Math.min(480, W * 0.36)
    const vh = m3.h * 0.6
    const village = HOUSES.map((h, k) => ({ x: (W - vw) / 2 + (k * vw) / HOUSES.length, y: m3.y + vh * (1 - h), w: vw / HOUSES.length, h: vh * h }))
    const front = H * 0.6
    // (the foliage pieces overlap a little, so that no gap opens between them)
    // (and those on the edges overflow the screen, so that no edge is uncovered when the mouse pushes them)
    const edge = (PUSH.leaves.x * W) / LEAVES.length
    const leaves = LEAVES.map((h, k) => {
      const r = { x: (k * W) / LEAVES.length - M / 2, y: H - front * h, w: W / LEAVES.length + M, h: front * h + M }
      if (k === 0) return { ...r, x: r.x - edge, w: r.w + edge }
      if (k === LEAVES.length - 1) return { ...r, w: r.w + edge }
      return r
    })
    // (the collage does not move on its own: only the mouse moves the pieces aside a little, see push.ts)
    return { m1, m2, m3, village, leaves }
  }

  // the state: the mouse, each house's light (which changes smoothly), where Yaya is (at first, the first hiding
  // place), which way she looks, and how many times she has been found
  let mouseX = -1
  let mouseY = -1
  let spot = 0
  let facing = Math.random() < 0.5 ? -1 : 1
  let score = 0
  // (where she comes from, since when she has moved, and when she was found)
  let was = spot
  let wasFacing = 1
  let since = 99
  let found: number | null = null
  let clock = 0
  const glow = HOUSES.map(() => 0)
  // (and her, glowing a little when the mouse passes over her, to make you want to click)
  let lit = 0
  let size = { W: 1, H: 1 }

  const inside = (r: Rect, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
  const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
  // to the next hiding place (after the end, start again)
  function next() {
    was = spot
    wasFacing = facing
    since = 0
    spot = spot === LAST ? 0 : spot + 1
    facing = Math.random() < 0.5 ? -1 : 1
    if (spot === 0) score = 0
  }
  // the pieces, pushed by the mouse (Yaya does not move with them: she gets uncovered)
  const pushed = push(HOUSES.length, LEAVES.length)
  // her box on screen, for a given place: sitting on a piece, she moves with it when the mouse pushes it; hidden
  // behind, she stays put (L: the pieces without the mouse, S: pushed)
  function box(k: number, L: Layout, S: Layout) {
    const still = SPOTS[k](size.W, size.H, L)
    const at = still.under !== undefined || still.behind !== undefined ? still : SPOTS[k](size.W, size.H, S)
    const h = size.H * at.tall
    const w = h * (images ? images.yaya.width / images.yaya.height : 0.29)
    return { at, x: at.x - w / 2, y: at.y - h * FEET, w, h }
  }
  // was she clicked? (in her box, slightly widened, but not on what hides her)
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
    // (is the mouse over her? the page then shows a hand)
    over: () => lit > 0.5,
    // the text under the notebook: « Trouvée ! » until she has faded, and the count; at the end, a wave
    caption: () => {
      if (spot === LAST) return 'Coucou !'
      const just = found !== null || (since < SAID && was !== LAST)
      // (both sentences have the same width, in a monospaced font: the counter does not move)
      return `${(just ? 'Trouvée !' : 'Où est Yaya ?').padEnd(13)}  ${score}/${LAST}`
    },
    pointer(x: number, y: number) {
      mouseX = x
      mouseY = y
    },
    // a click: if it is on her (and she is really there), she has been found
    click(x: number, y: number) {
      if (found !== null || since < LATE + COME) return false
      if (!hit(x, y)) return false
      found = clock
      if (spot !== LAST) score++
      return true
    },
    // move time forward (Yaya fading and reappearing, the pieces pushed by the mouse)
    tick(dt: number) {
      const L = layout(size.W, size.H)
      const ease = 1 - Math.exp(-dt * 5)
      clock += dt
      since += dt
      // (found: a moment later, she runs off to hide elsewhere)
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
    // draw the scene into ctx, for a W × H window
    draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
      size = { W, H }
      if (!images) return
      // (Yaya is placed according to the pieces in their place; they are drawn pushed by the mouse)
      const L = layout(W, H)
      const S = pushed.apply(L)
      const { sky, mountains, village, leaves, yaya } = images
      // Yaya at a given place, with some transparency (when she fades or appears)
      const yayaAt = (k: number, side: number, alpha: number) => {
        if (alpha <= 0.01) return
        const b = box(k, L, S)
        ctx.save()
        ctx.globalAlpha = alpha
        // (under the mouse: a little lighter, with a golden halo around her)
        const l = k === spot ? lit : 0
        if (l > 0.01) ctx.filter = `brightness(${1 + 0.35 * l}) drop-shadow(0 0 ${Math.max(3, b.h * 0.06) * l}px rgb(255 236 170 / ${0.9 * l}))`
        ctx.translate(b.at.x, 0)
        ctx.scale(side, 1)
        ctx.drawImage(yaya, -b.w / 2, b.y, b.w, b.h)
        ctx.restore()
      }
      // (where she is, and where she leaves from, each just before what hides her)
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
      // the houses (a little lighter under the mouse)
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
