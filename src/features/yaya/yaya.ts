import './yaya.css'
import { mount } from '@/features/carnet/carnet'
import { scene } from './scene'

// Où est Yaya ? en photos : le collage d'origine (voir scene.ts), dessiné tel quel.

const canvas = document.querySelector<HTMLCanvasElement>('.yy-scene')!
const ctx = canvas.getContext('2d')!
const ask = document.querySelector<HTMLElement>('.yy-ask')!
const yaya = scene()

let W = 0
let H = 0
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
addEventListener('resize', resize)
resize()

addEventListener('pointermove', (e) => yaya.pointer(e.clientX, e.clientY))
// (un clic sur Yaya : trouvée ; le doigt, sur un téléphone, compte aussi comme la souris)
addEventListener('pointerdown', (e) => {
  yaya.pointer(e.clientX, e.clientY)
  yaya.click(e.clientX, e.clientY)
})

let last = performance.now()
function draw(now: number) {
  requestAnimationFrame(draw)
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  yaya.tick(dt)
  ctx.clearRect(0, 0, W, H)
  yaya.draw(ctx, W, H)
  ask.textContent = yaya.caption()
  canvas.style.cursor = yaya.over() ? 'pointer' : ''
}
requestAnimationFrame(draw)

// la page dans le carnet (voir features/carnet)
mount()
