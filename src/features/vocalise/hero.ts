import { fly, ground, roofOf, type Ledge, type Physics, type World } from './world'

// La lueur : elle court sur un bout de colline, saute quand un son commence (ou juste après le bord : un son lancé
// un peu tard compte encore), plane tant qu'il dure, atterrit sur le bout de colline d'en face, se cogne aux pics
// (alors elle ne plane plus : elle tombe), ou se heurte au flanc d'une corniche trop haute. À chaque pas, ce qui
// s'est passé : rien, un atterrissage (sur quel bout de colline), une chute (finie : elle est sous la page).

export type Sound = { on: boolean; onset: boolean; asked: number }
export type Event = { landed: Ledge } | { fell: true } | null

export function hero() {
  const me = {
    x: 0,
    y: 0,
    vy: 0,
    on: null as Ledge | null,
    // le bout de colline quitté en dernier (d'où elle repart si elle tombe)
    from: null as Ledge | null,
    air: 0,
    // contre un flanc (elle n'avance plus), ou cognée aux pics (elle ne plane plus)
    stuck: false,
    bumped: false,
    // combien de temps le son a tenu pendant ce saut
    held: 0,
  }

  // (le saut ; auto : avant de jouer, elle saute toute seule, un peu moins haut)
  const jump = (k: Physics, auto = false) => {
    me.vy = -k.jump * (auto ? 0.8 : 1)
    me.on = null
    me.held = 0
  }

  return {
    me,
    // poser la lueur sur un bout de colline, à x
    place(l: Ledge, x: number, H: number) {
      Object.assign(me, { x, y: ground(l, H), vy: 0, on: l, from: l, stuck: false, bumped: false })
    },
    // un pas (playing : la partie a commencé ; sinon elle court au pas, et saute seule)
    step(dt: number, sound: Sound, land: World, k: Physics, H: number, s: number, playing: boolean): Event {
      if (!me.stuck) me.x += k.run * dt * (playing ? 1 : 0.35)
      if (me.on) {
        me.air = 0
        me.from = me.on
        if (me.x > me.on.x1) me.on = null
        else if (playing && sound.asked < 0.15) {
          jump(k)
          return null
        } else if (!playing && me.x > me.on.x1 - k.run * 0.25 && !me.on.roof) jump(k, true)
        if (me.on) {
          me.y = ground(me.on, H)
          return null
        }
      }
      me.air += dt
      if (playing && sound.onset && me.air < 0.12 && me.vy >= 0 && !me.bumped) jump(k)
      const held = (sound.on || !playing) && !me.bumped
      if (held) me.held += dt
      const before = me.y
      me.vy = fly(me.vy, held, dt, k)
      me.y += me.vy * dt

      // les pics, au-dessus du précipice qu'on traverse
      const from = me.from
      const next = from && land.after(from)
      if (from?.roof && next && me.x > from.x1 - 30 * s && me.x < next.x0 + 30 * s && me.y - 18 * s < roofOf(from, next, H, s)) {
        me.bumped = true
        me.vy = Math.max(me.vy, 160 * s)
      }

      const below = land.under(me.x)
      if (below) {
        const top = ground(below, H)
        if (me.vy >= 0 && before <= top + 2 && me.y >= top) {
          me.y = top
          me.vy = 0
          me.on = below
          me.bumped = false
          return { landed: below }
        }
        if (me.y > top + 4) me.stuck = true
      }
      return me.y > H + 40 ? { fell: true } : null
    },
  }
}
export type Hero = ReturnType<typeof hero>
