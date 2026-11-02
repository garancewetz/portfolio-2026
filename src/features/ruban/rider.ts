import { CLIMB, FALL, RISE, STAND, WALK, type Sprite } from '@/features/escalade/sprites'
import type { Ribbons, Stroke } from './ribbon'

// Le petit bonhomme (celui d'Escalade : une tête o, un corps #) : il marche sur le ruban, vers la droite. Quand le
// ruban descend, il glisse, plus vite ; quand il monte, il peine, et le ruban l'emporte un peu vers la gauche ; quand
// ça monte raide (un glissando vers l'aigu), il grimpe, les mains en avant, à son rythme de grimpeur. Il y prend du
// retard ; quand c'est facile (du plat, une descente), il accélère pour reprendre sa place sur la page. Au bout
// d'un ruban (un silence), il attend au bord ; dès qu'un autre commence, il saute par-dessus le trou, jusqu'à son
// début. S'il sort de la page (le ruban l'a emporté à gauche, ou il a manqué son saut), il retombe du ciel sur le
// prochain ruban qu'on chante. Arrêté longtemps, il s'endort.

// glisser : les bras écartés, une jambe devant ; dormir : assis, et ses z
const SLIDE: Sprite = ['   ', '_o_', ' # ', '/ /']
const SLEEP: Sprite[] = [
  ['  z', ' o ', '/#\\', ' ‾‾'],
  ['  Z', ' o ', '/#\\', ' ‾‾'],
]
const FONT = `500 15px 'JetBrains Mono', ui-monospace, monospace`
const LINE = 15
// la pesanteur (pixels par seconde, par seconde)
const GRAVITY = 1900
// à partir de quelle pente il grimpe (un pixel de montée par pixel d'avancée : 45°), et à quelle vitesse (en
// hauteur, une part de son pas)
const STEEP = 1
const CLIMB_RATE = 1
// sa place sur la page (une part de la largeur jusqu'à la tête du ruban) : en retard, il presse le pas (jusqu'à
// presque deux fois plus vite) ; en avance, il ralentit un peu
const HOME = 0.55

type Mode = 'ride' | 'air' | 'gone'

export function rider() {
  // x : dans le monde (comme les points du ruban) ; y : ses pieds, sur la page
  const me = { x: 0, y: 0, vx: 0, vy: 0, mode: 'gone' as Mode, on: null as Stroke | null, speed: 0, idle: 0, step: 0 }
  let pose: Sprite = STAND

  const land = (s: Stroke) => {
    me.mode = 'ride'
    me.on = s
    me.vy = 0
  }

  return {
    // walk : son pas (le défilement, en pixels par seconde, même quand le ruban est figé) ; screenX : où il est sur la
    // page ; headX : où naît le ruban ; yOf : la hauteur d'une note
    step(
      dt: number,
      ribbon: Ribbons,
      walk: number,
      screenX: (x: number) => number,
      headX: number,
      yOf: (m: number) => number,
      H: number,
    ) {
      const yAt = (s: Stroke, x: number) => {
        const m = ribbon.at(s, x)
        return m === null ? null : yOf(m)
      }

      if (me.mode === 'gone') {
        // il retombe du ciel, juste derrière la tête du ruban qu'on chante
        const s = ribbon.singing
        if (!s || s.length < 8) return
        Object.assign(me, { x: s[s.length - 1].x - walk * 0.4, y: -20, vx: walk, vy: 0, mode: 'air', on: s })
      }

      if (me.mode === 'ride' && me.on) {
        const s = me.on
        const end = s[s.length - 1].x
        const y = yAt(s, me.x)
        if (y === null || me.x >= end) {
          // au bout : un autre ruban commence plus loin ? il saute ; sinon il attend au bord
          me.x = Math.min(me.x, end)
          me.y = yAt(s, me.x) ?? me.y
          const next = s === ribbon.singing ? null : ribbon.after(end)
          if (next) {
            const tx = next[0].x + 6
            const ty = yAt(next, tx) ?? yOf(next[0].midi)
            const T = Math.max(0.35, Math.min(1.3, (tx - me.x) / (walk * 1.6)))
            Object.assign(me, { vx: (tx - me.x) / T, vy: (ty - me.y) / T - 0.5 * GRAVITY * T, mode: 'air', on: next })
          } else {
            // (au bout du ruban qu'on chante, il avance avec lui ; au bord d'un trou, il attend)
            me.speed = s === ribbon.singing ? walk : 0
            if (me.speed) pose = WALK[Math.floor((me.step += me.speed * dt) / 9) % WALK.length]
          }
        } else {
          // la pente (vers le bas : positive ; prise sur quelques pixels, pour que le vibrato ne compte pas) fait sa
          // vitesse : il glisse en descendant, peine en montant ; et quand c'est raide, il grimpe : il monte à vitesse
          // fixe, donc plus c'est raide, moins il avance
          const slope = Math.max(-8, Math.min(8, ((yAt(s, me.x + 10) ?? y) - (yAt(s, me.x - 2) ?? y)) / 12))
          const climbing = slope < -STEEP
          // (en retard : positif ; il rattrape quand le terrain est facile, pas en peinant dans une montée)
          const late = (headX * HOME - screenX(me.x)) / 200
          const hurry = slope > -0.3 ? 1 + Math.max(-0.25, Math.min(0.9, late)) : 1
          const want = climbing
            ? Math.max(walk * 0.04, (walk * CLIMB_RATE) / -slope)
            : Math.max(walk * 0.3, Math.min(walk * 2.6, walk * (1 + slope * 0.9) * hurry))
          me.speed += (want - me.speed) * (1 - Math.exp(-dt * (climbing ? 10 : 4)))
          me.x = Math.min(end, me.x + me.speed * dt)
          const before = me.y
          me.y = yAt(s, me.x) ?? y
          if (climbing) pose = CLIMB[Math.floor((me.step += Math.abs(me.y - before)) / 10) % CLIMB.length]
          else pose = slope > 0.45 ? SLIDE : WALK[Math.floor((me.step += me.speed * dt) / 9) % WALK.length]
        }
        me.idle = me.speed < 1 ? me.idle + dt : 0
        if (me.mode === 'ride' && me.speed < 1) pose = me.idle > 4 ? SLEEP[Math.floor(me.idle * 1.5) % 2] : STAND
      }

      if (me.mode === 'air') {
        me.x += me.vx * dt
        me.vy += GRAVITY * dt
        const before = me.y
        me.y += me.vy * dt
        pose = me.vy < 0 ? RISE : FALL
        // il atterrit sur son ruban (ou sur n'importe quel autre, s'il passe dessus en tombant)
        for (const s of me.on ? [me.on, ...ribbon.strokes] : ribbon.strokes) {
          const y = yAt(s, me.x)
          if (y !== null && me.vy > 0 && before <= y + 2 && me.y >= y) {
            me.y = y
            land(s)
            break
          }
        }
      }

      // sorti de la page : à gauche (le ruban l'a emporté), ou en bas (un saut manqué)
      if (screenX(me.x) < 10 || me.y > H + 60) {
        me.mode = 'gone'
        me.on = null
      }
    },
    draw(g: CanvasRenderingContext2D, screenX: (x: number) => number) {
      if (me.mode === 'gone') return
      g.font = FONT
      g.textAlign = 'center'
      g.textBaseline = 'bottom'
      g.fillStyle = '#eeeae2'
      // (les pieds un peu au-dessus du fil)
      const x = screenX(me.x)
      for (let i = 0; i < pose.length; i++) g.fillText(pose[i], x, me.y - 3 - (pose.length - 1 - i) * LINE)
    },
  }
}
