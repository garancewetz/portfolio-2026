import type { Land } from './land'
import { rand } from './pose'
import { pointer } from './presence'

// Un vol (celles qui volent : le yéti, le hibou) : quelques figures enchaînées au hasard, puis l'atterrissage.
// - la balade : vers un point de la page, en ondulant ; les curieuses vont parfois voir le visiteur ;
// - le surplace : elle reste en l'air, en battant vite, en se balançant un peu ;
// - la plongée : elle pique, ailes repliées, puis remonte en battant, en avançant dans le sens où elle va ;
// - l'atterrissage : elle choisit où se poser (une des lignes), là où on regarde, s'en approche, et
//   descend doucement dessus.
// (x dans le paysage : elle vole toujours vers ce qu'on regarde)

type Move = 'wander' | 'hover' | 'swoop' | 'land'

// en pixels par seconde : son allure en balade, en descente pour se poser ; la souplesse de ses virages
const CRUISE = [70, 120]
const DESCENT = 45
const TURN = 2.6

export function flight(room: HTMLElement, land: Land, curious: boolean) {
  let move: Move = 'wander'
  let left = 0 // le temps qui reste à la figure en cours
  let moves = 0 // les figures qui restent avant de se poser
  let speed = 0
  let vx = 0
  let vy = 0
  let t = 0
  let tx = 0 // le point visé (x, y depuis le bas)
  let ty = 0
  let where = 0 // la ligne où se poser
  // la plongée : d'où elle part, dans quel sens, sa longueur, sa profondeur ; où elle en est (de 0 à 1)
  let sx = 0
  let sy = 0
  let side = 1
  let span = 0
  let depth = 0
  let done = 0

  const aim = (cw: number, top: number) => {
    // (vers le visiteur, s'il est là, pour les curieuses ; sinon un point au hasard)
    if (curious && pointer.here && Math.random() < 0.5) {
      tx = pointer.x - cw / 2
      ty = Math.min(top, pointer.y + 30)
    } else {
      tx = rand(0, room.clientWidth - cw)
      ty = rand(0.2, 0.9) * top
    }
    // (au-dessus du fil)
    ty = Math.min(top, Math.max(ty, land.y(0, tx + cw / 2) + 60))
  }
  const next = (x: number, y: number, dir: number, cw: number, top: number) => {
    if (moves-- <= 0) {
      // se poser : sur une des lignes, au hasard, là où on regarde
      where = Math.floor(Math.random() * land.count)
      move = 'land'
      tx = rand(0, room.clientWidth - cw)
      return
    }
    const p = Math.random()
    if (p < 0.45) {
      move = 'wander'
      left = rand(1.5, 3.5)
      speed = rand(CRUISE[0], CRUISE[1])
      aim(cw, top)
    } else if (p < 0.75) {
      move = 'hover'
      left = rand(0.8, 2)
    } else {
      // (la plongée : dans le sens où elle va, et elle s'y tient jusqu'au bout)
      move = 'swoop'
      sx = x
      sy = y
      side = Math.sign(vx) || dir
      span = rand(140, 240)
      depth = rand(50, 110)
      done = 0
      left = Infinity
    }
  }

  return {
    // décoller, vers l'avant (dir) et vers le haut
    start(dir: number, cw: number, top: number) {
      moves = Math.floor(rand(2, 6))
      vx = dir * 40
      vy = 140
      move = 'wander'
      left = rand(1, 2)
      speed = rand(CRUISE[0], CRUISE[1])
      aim(cw, top)
    },
    // fatiguée (la nuit) : elle va se poser tout de suite
    rest() {
      if (move === 'land') return
      moves = 0
      left = 0
      if (move === 'swoop') next(0, 0, 1, 0, 0)
    },
    // à chaque image : où elle en est ; la vitesse de ses battements ; la ligne où elle s'est posée (-1 : en vol)
    step(dt: number, x: number, y: number, dir: number, cw: number, top: number) {
      t += dt
      left -= dt
      if (move !== 'land' && move !== 'swoop' && left <= 0) next(x, y, dir, cw, top)
      // (la ligne où se poser bouge un peu : le fil se balance)
      if (move === 'land') ty = land.y(where, tx + cw / 2)
      let flaps = 10
      if (move === 'wander' || move === 'land') {
        // (vers le point visé, en virant en douceur ; en balade, elle ondule)
        const dx = tx - x
        const dy = (move === 'land' && Math.abs(dx) < 12 ? ty : ty + (move === 'land' ? 40 : 0)) - y
        const d = Math.hypot(dx, dy) || 1
        const s = move === 'land' && Math.abs(dx) < 12 ? DESCENT : Math.min(speed || CRUISE[0], d * 2)
        vx += ((dx / d) * s - vx) * Math.min(1, TURN * dt)
        vy += ((dy / d) * s - vy) * Math.min(1, TURN * dt)
        if (move === 'wander') vy += Math.sin(t * 5) * 30 * dt * 4
        if (move === 'wander' && d < 20) left = 0
        if (move === 'land' && Math.abs(dx) < 12) flaps = 6
      } else if (move === 'hover') {
        // (sur place : elle freine, et se balance)
        vx *= 1 - Math.min(1, 1.2 * dt)
        vy = Math.sin(t * 2.5) * 9
        flaps = 18
      } else if (dt > 0) {
        // (la plongée : vers le bas, puis la remontée, puis la figure suivante)
        done = Math.min(1, done + dt / 1.6)
        const nx = sx + side * span * done
        const ny = sy - depth * Math.sin(Math.PI * done)
        vx = (nx - x) / dt
        vy = (ny - y) / dt
        flaps = done < 0.45 ? 3 : 16
        if (done >= 1) next(nx, ny, side, cw, top)
      }
      const nx = Math.max(0, Math.min(room.clientWidth - cw, x + vx * dt))
      // (jamais sous le fil)
      let ny = Math.max(land.y(0, nx + cw / 2), Math.min(top, y + vy * dt))
      // posée ?
      let landed = -1
      if (move === 'land' && Math.abs(tx - nx) < 12 && ny <= ty + 1) {
        ny = ty
        landed = where
      }
      return { x: nx, y: ny, vx, flaps, landed }
    },
  }
}
