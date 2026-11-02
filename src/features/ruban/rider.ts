import { CLIMB, FALL, HANG, RISE, STAND, WALK, type Sprite } from '@/features/escalade/sprites'
import type { Ribbons, Stroke } from './ribbon'

// Le petit bonhomme (celui d'Escalade : une tête o, un corps #) : il marche sur le ruban, vers la droite, et se
// comporte comme un vrai petit grimpeur.
// - Quand le ruban descend, il glisse, plus vite ; trop raide, il ne tient plus : il décroche, et tombe, ou rebondit
//   plus bas sur le même ruban.
// - Quand il monte, il peine ; raide (un glissando vers l'aigu), il grimpe, les mains en avant, à son rythme. Il y
//   prend du retard ; quand c'est facile (du plat, une descente), il presse le pas pour reprendre sa place.
// - Au bout d'un ruban (un silence), il attend au bord : sur du plat, debout ; sur une pente, accroupi, les bras
//   écartés ; si ça descend trop, il glisse, et part dans le vide. Dès qu'un autre ruban commence, il saute le trou ;
//   parfois un peu court : alors il s'accroche au bord d'une main, pend un instant, et se hisse dessus.
// - En tombant, s'il passe à portée de main d'un ruban (le fil entre ses pieds et ses mains), il s'y accroche aussi.
// - S'il sort de la page (emporté à gauche, ou tombé en bas), il retombe du ciel sur le ruban qu'on chante.
//   Arrêté longtemps, il s'endort.

// glisser : les bras écartés, une jambe devant ; se retenir : accroupi, les bras écartés ; dormir : assis, et ses z
const SLIDE: Sprite = ['   ', '_o_', ' # ', '/ /']
const BRACE: Sprite = ['   ', '   ', '_o_', '/#\\']
const SLEEP: Sprite[] = [
  ['  z', ' o ', '/#\\', ' ‾‾'],
  ['  Z', ' o ', '/#\\', ' ‾‾'],
]
const FONT = `500 15px 'JetBrains Mono', ui-monospace, monospace`
const LINE = 15
// la pesanteur (pixels par seconde, par seconde)
const GRAVITY = 1900
// les pentes (en pixels de hauteur par pixel d'avancée ; vers le bas : positif) : à partir de laquelle il grimpe, à
// laquelle il décroche en descendant, et à laquelle il ne tient plus au bord ; sa vitesse de grimpe (en hauteur, une
// part de son pas)
const STEEP = 1
const SLIP = 2.5
const EDGE = 0.6
const CLIMB_RATE = 1
// sa place sur la page (une part de la largeur jusqu'à la tête du ruban) : en retard, il presse le pas (jusqu'à
// presque deux fois plus vite) ; en avance, il ralentit un peu
const HOME = 0.55
// pendu : ses mains sur le fil, ses pieds dessous ; combien de temps il pend, puis combien il met à se hisser
const HANG_DROP = 3 * LINE + 9
const DANGLE = 0.35
const HOIST = 0.5
// ses mains, au-dessus de ses pieds, quand il tombe les bras en l'air (ce qu'il peut attraper)
const REACH = 3 * LINE + 4

type Mode = 'ride' | 'air' | 'hang' | 'gone'

export function rider() {
  // x : dans le monde (comme les points du ruban) ; y : ses pieds, sur la page ; hung : depuis quand il pend
  const me = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mode: 'gone' as Mode,
    on: null as Stroke | null,
    speed: 0,
    idle: 0,
    step: 0,
    hung: 0,
  }
  let pose: Sprite = STAND
  const walking = (by: number) => WALK[Math.floor((me.step += by) / 9) % WALK.length]

  return {
    // walk : son pas (le défilement, en pixels par seconde) ; screenX : où il est sur la
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
      // la pente sous lui (prise sur quelques pixels, pour que le vibrato ne compte pas)
      const slopeAt = (s: Stroke, x: number) => {
        const a = yAt(s, x - 6) ?? yAt(s, x)
        const b = yAt(s, x + 6) ?? yAt(s, x)
        return a === null || b === null ? 0 : Math.max(-8, Math.min(8, (b - a) / 12))
      }
      const fall = (vx: number, vy: number) => Object.assign(me, { mode: 'air', vx, vy })

      if (me.mode === 'gone') {
        // il retombe du ciel, juste derrière la tête du ruban qu'on chante
        const s = ribbon.singing
        if (!s || s.length < 8) return
        Object.assign(me, { x: s[s.length - 1].x - walk * 0.4, y: -20, vx: walk, vy: 0, mode: 'air', on: s })
      }

      if (me.mode === 'hang' && me.on) {
        // pendu au fil (qui bouge avec la voix) : il pend un instant, puis se hisse
        const line = yAt(me.on, me.x) ?? yAt(me.on, me.on[0].x)!
        me.hung += dt
        const up = Math.max(0, Math.min(1, (me.hung - DANGLE) / HOIST))
        me.y = line + HANG_DROP * (1 - up * up * (3 - 2 * up))
        pose = up === 0 ? HANG[Math.floor(me.hung * 6) % HANG.length] : up < 0.75 ? CLIMB[Math.floor(up * 6) % 2] : RISE
        if (up >= 1) Object.assign(me, { mode: 'ride', y: line, speed: 0, idle: 0 })
      }

      if (me.mode === 'ride' && me.on) {
        const s = me.on
        const end = s[s.length - 1].x
        const y = yAt(s, me.x)
        const slope = slopeAt(s, Math.min(me.x, end))
        if (y === null || me.x >= end) {
          me.x = Math.min(me.x, end)
          me.y = yAt(s, me.x) ?? me.y
          const next = s === ribbon.singing ? null : ribbon.after(end)
          if (next) {
            // un autre ruban commence plus loin : il saute le trou (une fois sur trois, un peu court : il se
            // rattrapera au bord)
            const short = Math.random() < 0.35 ? 0.8 + Math.random() * 0.1 : 1
            const tx = me.x + (next[0].x + 6 - me.x) * short
            const ty = yAt(next, next[0].x + 6) ?? yOf(next[0].midi)
            const T = Math.max(0.35, Math.min(1.3, (tx - me.x) / (walk * 1.6)))
            Object.assign(me, { on: next })
            fall((tx - me.x) / T, (ty - me.y) / T - 0.5 * GRAVITY * T)
          } else if (s === ribbon.singing) {
            // au bout du ruban qu'on chante : il avance avec lui
            me.speed = walk
            pose = slope > 0.45 ? SLIDE : walking(walk * dt)
          } else if (slope > EDGE) {
            // au bord d'une descente trop raide : il ne tient pas, il glisse dans le vide
            pose = SLIDE
            fall(walk * 0.5, 60)
          } else {
            // au bord d'un trou, il attend : debout sur du plat, accroupi sur une pente
            me.speed = 0
            me.idle += dt
            pose = Math.abs(slope) > 0.25 ? BRACE : me.idle > 4 ? SLEEP[Math.floor(me.idle * 1.5) % 2] : STAND
          }
        } else if (slope > SLIP) {
          // trop raide en descendant : il décroche, emporté par son élan
          pose = FALL
          fall(Math.max(me.speed, walk), Math.max(me.speed, walk) * 0.8)
        } else {
          // la pente fait sa vitesse : il glisse en descendant, peine en montant ; raide, il grimpe : il monte à
          // vitesse fixe, donc plus c'est raide, moins il avance
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
          me.idle = 0
          if (climbing) pose = CLIMB[Math.floor((me.step += Math.abs(me.y - before)) / 10) % CLIMB.length]
          else pose = slope > 0.45 ? SLIDE : walking(me.speed * dt)
        }
      }

      if (me.mode === 'air') {
        const beforeX = me.x
        me.x += me.vx * dt
        me.vy += GRAVITY * dt
        const before = me.y
        me.y += me.vy * dt
        if (pose !== SLIDE || me.vy > 200) pose = me.vy < 0 ? RISE : FALL
        // il retrouve un ruban dès qu'il le traverse : en tombant dessus, ou quand le fil remonte et le rattrape par
        // en dessous (une descente raide qui repart vers le haut) ; on compare où il était par rapport au fil à
        // l'image d'avant, et maintenant. Sinon, s'il en a un à portée de main (le fil entre ses pieds et ses mains,
        // et pas trop raide : il faut pouvoir se hisser dessus), il s'y accroche
        const strokes = me.on ? [me.on, ...ribbon.strokes] : ribbon.strokes
        for (const s of strokes) {
          const y = yAt(s, me.x)
          if (y === null) continue
          const was = yAt(s, beforeX)
          const crossed = was === null ? me.vy > 0 && me.y >= y && me.y - y < 8 : before <= was + 2 && me.y >= y
          if (crossed) {
            Object.assign(me, { mode: 'ride', on: s, y, vy: 0 })
            break
          }
          if (me.vy > 0 && me.y > y + 4 && me.y - REACH < y && Math.abs(slopeAt(s, me.x)) < STEEP) {
            Object.assign(me, { mode: 'hang', on: s, hung: 0, vx: 0, vy: 0, speed: 0 })
            break
          }
        }
      }

      // sorti de la page : à gauche (le ruban l'a emporté), ou en bas (tombé)
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
