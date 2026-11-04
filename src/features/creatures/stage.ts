import type { Creature } from './art'
import { flight } from './flight'
import type { Land } from './land'
import { clock } from './mood'
import { mirror, pad, pick, rand, type Phase } from './pose'
import { NOTICE, pointer, react, temper } from './presence'
import { steer, YETI } from './steer'

// Une créature en liberté sur les trois lignes du paysage (voir land.ts). Elle marche, s'arrête, repart, saute (la
// loutre glisse dans les descentes), bondit sur la ligne du dessus, tombe sur celle du dessous, grimpe aux poteaux
// aux bords de la page ; les fils la renvoient en l'air (des trampolines), la font sautiller. Elle croise les autres (demi-tour, saut,
// ou un moment assises face à face), vole parfois (voir flight.ts), tire un trait de sa couleur (voir trails.ts),
// dort la nuit (voir mood.ts), remarque le visiteur (voir presence.ts) ; le yéti se guide aux flèches (voir
// steer.ts), et ne quitte jamais son fil par le bas de lui-même. Tournée vers la gauche, son dessin est retourné.

// en pixels par seconde : la pesanteur ; la grimpe
const GRAVITY = 900
const CLIMB = 34
// celles qui volent : leur descente en planant (la plus rapide), après un saut ; leurs battements, par seconde
const GLIDE = 80
const FLAPS = 16
// (un fil : à quelle vitesse de chute il la renvoie en l'air, et ce qu'il lui rend ; à partir de quand son rebond la
// fait sautiller) ; (le yéti, guidé) sa chute, à la flèche du bas
const BOUNCE = 150
const SPRING = 0.82
const JOLT = 12
const DIVE = 520
// (le yéti, guidé, quand il vole) sa poussée, en pixels par seconde par seconde ; sa montée, au plus
const LIFT = 1500
const SOAR = 240
// la pente où la loutre se laisse glisser
const SLIDE = 0.22

// ce que les autres voient d'elle : où elle est (dans le paysage), sa largeur, la ligne où elle se tient (-1 : en
// l'air, ou au mur) ; et de quoi l'inviter à s'asseoir un moment, tournée d'un côté
export type Body = { x: number; w: number; on: number; sit: (s: number, face: number) => void }

export function roam(
  room: HTMLElement,
  art: HTMLElement,
  c: Creature,
  w: number,
  h: number,
  land: Land,
  bodies: Body[],
  print: (x: number, y: number) => void,
) {
  // son allure à elle, son caractère, ses heures
  const speed = rand(24, 46)
  const hop = rand(0.03, 0.08)
  const mood = temper(c.name)
  const time = clock()
  let phase: Phase = 'idle'
  // dir : 1 vers la droite, -1 vers la gauche ; x, y : depuis le bas à gauche de la page, en pixels
  let dir = Math.random() < 0.5 ? 1 : -1
  let born = false
  let x = 0
  let y = 0
  let on = 0 // la ligne où elle se tient (0 : celle du bas ; -1 : aucune)
  let vx = 0
  let vy = 0
  let moved = 0
  let left = rand(0.5, 3) // le temps qui reste au geste en cours (marche, pause, accroupie)
  let calm = 0 // (après une rencontre, un moment sans en remarquer d'autre)
  let top = 0 // la hauteur où elle s'arrête de grimper
  let slide = false // (la loutre) elle glisse dans la descente
  // (celles qui volent : leur vol, et la vitesse de leurs battements)
  const wings = c.fly ? flight(room, land, mood === 'curious') : null
  let flaps = FLAPS
  // (le yéti : on le guide aux flèches)
  const pilot = c.name === YETI ? steer(room) : null
  let t = 0
  let shown = ''

  const me: Body = {
    x: -1,
    w: 0,
    on: 0,
    sit: (s, face) => {
      if (phase !== 'walk' && phase !== 'idle') return
      phase = 'idle'
      left = s
      dir = face
      calm = s + 1.5
    },
  }
  bodies.push(me)

  let lift = false // (le yéti, guidé, en l'air : il vole)
  const pose = () => pick(c, w, { phase: lift ? 'fly' : phase, slide, moved, vy: pilot && phase === 'air' && !lift ? 0 : vy, t, flaps })
  const leap = (up: number, across: number) => {
    phase = 'air'
    on = -1
    vx = across
    vy = up
  }
  // (se laisser tomber de sa ligne : un peu en dessous, pour ne pas s'y reposer aussitôt : voir land.reach)
  let soft = false // (elle descend exprès : le fil d'en dessous la reçoit sans la renvoyer)
  const drop = () => {
    soft = true
    leap(0, dir * speed)
    y -= 12
  }
  const walk = (s: number) => {
    phase = 'walk'
    moved = 0
    left = s
  }
  const moves = {
    go: (d: number) => ((dir = d), phase === 'walk' ? (left = 1) : walk(1)),
    stop: () => phase === 'walk' && ((phase = 'idle'), (left = 1)),
    jump: (up: number) => leap(up, dir * speed * 3),
    drop: () => on > 0 && drop(),
  }

  return (dt: number) => {
    const cw = art.offsetWidth
    const W = room.clientWidth
    // (la place de départ, au hasard : une fois la page à sa taille)
    if (!born) {
      if (!W) return
      born = true
      on = Math.floor(Math.random() * land.count)
      x = Math.random() * Math.max(0, W - cw)
    }
    const mid = x + cw / 2
    const { asleep: night, pace } = time()
    t += dt
    left -= dt
    calm -= dt
    // (debout : à la hauteur de sa ligne, là où elle est ; le fil plie, se balance)
    if (on >= 0) y = land.y(on, mid)
    const slope = on >= 0 ? land.slope(on, mid) : 0
    // (pas plus haut que la page, sous la ligne du carnet)
    const ceiling = room.clientHeight - art.offsetHeight - 48
    // (le bord droit de la page ; si elle a rétréci, elle y revient)
    const edge = Math.max(0, W - cw)
    if (x > edge) x = edge

    // le visiteur, s'il est près d'elle (à peu près à sa hauteur, ou un peu au-dessus)
    const dx = pointer.x - mid
    const near = pointer.here && Math.abs(dx) < NOTICE && pointer.y - y > -40 && pointer.y - y < 160
    const guided = !!pilot?.guided(dt)
    if (guided && phase === 'fly') wings?.rest()
    if (guided && on >= 0 && (phase === 'idle' || phase === 'walk' || phase === 'crouch' || phase === 'sleep')) pilot!.act(moves)
    let hurry = guided ? 3.5 : 1
    const seen = !guided && near && on >= 0 && !night && (phase === 'walk' || phase === 'idle') ? react(mood, dx, dir) : null
    if (seen) {
      dir = seen.dir
      hurry = seen.hurry
      if (seen.stop) {
        phase = 'idle'
        left = 0.6
      } else if (phase === 'idle') walk(seen.walk)
    }

    // (son fil rebondit fort : elle sautille, ou parfois en tombe)
    if (on > 0 && (phase === 'idle' || phase === 'walk') && land.shake(on, mid) > JOLT && Math.random() < 2 * dt) {
      if (!pilot && Math.random() < 0.25) drop()
      else leap(rand(90, 160), 0)
    } else if (phase === 'sleep') {
      // (le matin : elle se réveille, et reste un moment avant de repartir)
      if (!night) {
        phase = 'idle'
        left = rand(1, 4)
      }
    } else if (night && !guided && on >= 0 && phase !== 'climb' && (Math.abs(slope) < 0.05 || (phase === 'walk' && slope * dir > 0))) {
      // (la nuit : au creux d'une colline, ou sur un sommet plat, elle s'endort)
      phase = 'sleep'
    } else if (phase === 'fly' && wings) {
      // en vol : ses figures, jusqu'à ce qu'elle se pose (la nuit, elle va se poser tout de suite)
      if (night) wings.rest()
      const f = wings.step(dt, x, y, dir, cw, ceiling)
      x = f.x
      y = f.y
      flaps = f.flaps
      if (Math.abs(f.vx) > 30) dir = Math.sign(f.vx) // (seulement quand elle repart franchement de l'autre côté)
      if (f.landed >= 0) {
        on = f.landed
        y = land.y(on, x + cw / 2)
        land.kick(on, x + cw / 2)
        phase = 'crouch'
        left = 0.5
      }
    } else if (phase === 'idle' || phase === 'crouch') {
      if (!guided && (left <= 0 || night)) {
        // (après une pause, elle repart, parfois dans l'autre sens)
        if (phase === 'idle' && Math.random() < 0.35) dir = -dir
        walk(rand(3, 8))
      }
    } else if (phase === 'walk') {
      // (la nuit, elle descend vers le creux ; guidé, le yéti ne fait rien de lui-même)
      const busy = night || guided
      if (night && !guided) dir = -Math.sign(slope) || dir
      // (plus vite en descente, moins en montée ; la loutre se laisse glisser)
      const down = -slope * dir
      slide = c.name === 'loutre' && down > SLIDE
      const grade = slide ? 2.6 : Math.max(0.45, Math.min(1.8, 1 + down * 1.5))
      const step = dir * speed * pace * hurry * grade * dt
      x += step
      moved += Math.abs(step)
      // une autre, juste devant elle, sur sa ligne : demi-tour, un saut par-dessus, ou elles s'assoient
      const other =
        calm <= 0 &&
        !guided &&
        bodies.find((b) => b !== me && b.on === on && Math.sign(b.x + b.w / 2 - mid) === dir && Math.abs(b.x + b.w / 2 - mid) < (b.w + cw) / 2 + 6)
      // la ligne du dessus, si elle est à portée de bond
      const above = on + 1 < land.count && land.y(on + 1, mid) - y < 0.3 * room.clientHeight ? on + 1 : -1
      if (other) {
        calm = 1.5
        const r = Math.random()
        if (r < 0.35) {
          // (l'une en face de l'autre, un moment)
          const s = rand(3, 7)
          me.sit(s, dir)
          other.sit(s, -dir)
        } else if (r < 0.7) dir = -dir
        else leap(320, dir * ((other.w + cw) / 0.68))
      } else if (x <= 0 || x >= edge) {
        x = x <= 0 ? 0 : edge
        if (!guided && Math.random() < 0.5) {
          // un bord de la page : elle l'escalade, plus ou moins haut
          phase = 'climb'
          on = -1
          moved = 0
          top = Math.min(ceiling, y + rand(0.1, 0.35) * room.clientHeight)
        } else dir = x <= 0 ? 1 : -1
      } else if (on > 0 && !busy && !pilot && Math.random() < 0.03 * pace * dt) {
        // (elle se laisse tomber sur la ligne du dessous)
        drop()
      } else if (above > 0 && !busy && Math.random() < 0.12 * pace * dt) {
        leap(Math.sqrt(2 * GRAVITY * (land.y(above, mid) - y + 24)), dir * speed * 0.4)
      } else if (wings && !busy && Math.random() < 0.04 * pace * dt) {
        // (celles qui volent : elles décollent, de temps en temps)
        phase = 'fly'
        on = -1
        wings.start(dir, cw, ceiling)
      } else if (!busy && Math.random() < hop * pace * dt) leap(rand(220, 340), dir * speed * 1.8)
      else if (left <= 0 && !busy) {
        phase = 'idle'
        left = rand(1.5, 5) / pace
      }
    } else if (phase === 'climb') {
      y += CLIMB * pace * dt
      moved += CLIMB * pace * dt
      if (y >= top) {
        // (en haut du bord : elle se retourne, et saute dans le paysage)
        dir = x <= 0 ? 1 : -1
        leap(rand(120, 220), dir * rand(90, 170))
      }
    } else if (phase === 'air') {
      x += vx * dt
      // (contre un bord, en volant : elle repart dans l'autre sens)
      if (c.fly && (x <= 0 || x >= edge) && Math.sign(vx) === (x <= 0 ? -1 : 1)) {
        vx = -vx
        dir = -dir
      }
      x = Math.max(0, Math.min(edge, x))
      const was = y
      vy -= GRAVITY * dt
      // (celles qui volent planent en redescendant ; guidé, le yéti tombe, et plonge à la flèche du bas)
      lift = guided && pilot!.flying()
      if (lift) vy = Math.min(SOAR, vy + (GRAVITY + LIFT) * dt)
      if (guided && pilot!.fall()) (vy = Math.min(vy, -DIVE)), (soft = true)
      if (guided && pilot!.side()) vx = (dir = pilot!.side()) * speed * 4
      if (c.fly && !guided) vy = Math.max(-GLIDE, vy)
      y += vy * dt
      if (y > ceiling) {
        y = ceiling
        vy = Math.min(vy, 0)
      }
      // en descendant, elle se pose sur la première ligne qu'elle traverse (celle du bas la retient toujours)
      const m = x + cw / 2
      const to = vy < 0 ? land.reach(was, y, m) : -1
      if (to >= 0) {
        y = land.y(to, m)
        land.kick(to, m, -vy)
        // (tombée d'assez haut : le fil la renvoie en l'air, comme un trampoline)
        if (vy < -BOUNCE && !soft) vy = -vy * SPRING
        else {
          on = to
          phase = 'crouch'
          left = 0.4
        }
      }
    }

    if (phase !== 'air') lift = soft = false
    // (son trait la suit, partout où elle passe)
    if (phase !== 'sleep') print(x + cw / 2, y)
    if (on >= 0 && phase !== 'air' && phase !== 'climb' && phase !== 'fly') land.press(on, x + cw / 2)
    me.x = x
    me.w = cw
    me.on = phase === 'air' || phase === 'climb' || phase === 'fly' ? -1 : on
    const text = pad(dir === 1 || phase === 'sleep' ? pose() : mirror(pose(), w), h)
    if (text !== shown) art.textContent = shown = text
    art.style.transform = `translate(${x}px, ${-y}px)`
    pilot?.mark(x + cw / 2, y + art.offsetHeight)
  }
}
