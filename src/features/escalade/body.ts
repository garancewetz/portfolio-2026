// Le bonhomme et ses gestes, sur les bords de la fenêtre : le bas (il marche), les côtés (il grimpe), le haut (il
// avance suspendu, main après main). Hors des bords, il tombe ; il saute (barre d'espace), et en l'air, il peut
// sauter encore deux fois (un triple saut). La fenêtre est sa boîte, et ce qu'on lui fait le touche : un bord qui
// s'éloigne le fait lâcher ou tomber, un bord qui avance le pousse, une fenêtre trop basse l'écrase ; une fenêtre
// qu'on déplace vite le bouscule (inertie : il part à l'opposé), le fait glisser, décoller, lâcher prise. Les traits
// qu'il a tracés (trail.ts) ne sont pas des sols : il passe au travers ; mais avec ↑, il s'y accroche, et les suit
// avec les flèches, dans tous les sens : raides, il les escalade ; plats, il s'y hisse et avance suspendu dessous.
// Ce module ne dessine rien : il dit où il est, dans quelle posture, tourné de quel côté, et combien de chemin il a
// fait (l'image de la marche en dépend).

export type Where = 'floor' | 'wall' | 'line' | 'ceiling' | 'air' | 'carried' | 'away' | 'sleep' | 'door'
export type Keys = { left: boolean; right: boolean; up: boolean; down: boolean; jump?: boolean }
export type Size = () => { W: number; H: number; w: number; h: number }
// les traits qu'il a tracés : le plus proche d'un point (le point où s'y accrocher, et la direction du trait)
export type Lines = {
  near: (
    x: number,
    y: number,
    reach: number,
    keep?: (p: { x: number; y: number; ux: number; uy: number }) => boolean,
  ) => { x: number; y: number; ux: number; uy: number } | null
}

const WALK = 150 // px/s, en marchant
const CLIMB = 95 // px/s, en grimpant
const HANG = 110 // px/s, suspendu
const GRAVITY = 1800 // px/s², en tombant
const JUMP = 620 // px/s, l'élan d'un saut (à peu près 100 px de haut)
const AGAIN = 560 // px/s, l'élan d'un saut de plus, en l'air
const AIR_JUMPS = 2 // en l'air, il peut encore sauter deux fois (un triple saut)
const FRICTION = 7 // au sol, une glissade s'arrête vite
const BOUNCE = 0.35 // contre un bord, en l'air : il rebondit un peu
const SLIP = 1400 // px/s² : la fenêtre bouge plus fort que ça, il glisse au sol
const GRIP = 2600 // px/s² : plus fort que ça, il lâche le bord où il est accroché
const REACH = 10 // px : en suivant un trait, il le perd (le bout) s'il n'y en a plus à moins de ça

export function createBody(size: Size, lines?: Lines) {
  const b = {
    where: 'floor' as Where,
    // la boîte du bonhomme (coin en haut à gauche, px), son côté (1 : vers la droite), sa vitesse (glissade, chute)
    x: 0,
    y: 0,
    face: 1 as 1 | -1,
    vx: 0,
    vy: 0,
    // le chemin fait (pour l'image de la marche, de l'escalade) ; s'il bouge en ce moment ; s'il vient d'être poussé
    // par un bord (s), ou s'il est écrasé par une fenêtre trop basse
    trip: 0,
    moving: false,
    pushed: 0,
    squashed: false,
    // les sauts déjà faits en l'air (ils reviennent en touchant un sol, un bord, un trait)
    jumps: 0,
    // accroché à un trait : où sont ses mains (sur le trait), et si le trait est raide (il l'escalade) ou plat (il y
    // est suspendu)
    grip: { x: 0, y: 0 },
    steep: true,
    // (il vient de lâcher un trait : un instant, il ne s'y raccroche pas, même ↑ tenue)
    cool: 0,
  }
  // à l'arrivée : au milieu, en bas
  const start = () => {
    const { W, H, w, h } = size()
    Object.assign(b, { where: 'floor', x: (W - w) / 2, y: H - h, face: 1, vx: 0, vy: 0, trip: 0 })
  }
  start()
  // il lâche (ou décolle) : en l'air, avec cet élan
  const fall = (vx = 0, vy = 0) => {
    if (b.where === 'line') b.cool = 0.45
    Object.assign(b, { where: 'air', vx, vy })
  }

  // promené à la souris, vers (x, y)
  function drag(x: number, y: number) {
    if (b.where === 'carried') Object.assign(b, { x, y })
  }
  // accroché à un trait, ses mains sur le trait : sa boîte (raide : contre le trait, du côté où il regarde, ses mains
  // à hauteur d'épaules ; plat : pendu dessous, les mains en haut)
  const GRIP_AT = 0.3 // (ses mains, en part de sa hauteur)
  function hang(w: number, h: number) {
    if (b.steep) Object.assign(b, { x: b.face === 1 ? b.grip.x - w : b.grip.x, y: b.grip.y - h * GRIP_AT })
    else Object.assign(b, { x: b.grip.x - w / 2, y: b.grip.y })
  }

  // dt : le temps passé (s) ; k : les flèches tenues ; ax, ay : l'accélération de la fenêtre sur l'écran (px/s²)
  function step(dt: number, k: Keys, ax = 0, ay = 0) {
    if (b.where === 'carried' || b.where === 'away' || b.where === 'sleep' || b.where === 'door') return
    const { W, H, w, h } = size()
    const right = W - w
    const floor = H - h
    const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    const dy = (k.down ? 1 : 0) - (k.up ? 1 : 0)
    const was = { x: b.x, y: b.y }
    // un bord qui avance le pousse (il reste dans la fenêtre)
    if (b.x > right + 0.5 || b.x < -0.5) b.pushed = 0.4
    b.pushed = Math.max(0, b.pushed - dt)
    b.squashed = H < h * 1.7
    // (contre quel bord : -1 à gauche, 1 à droite, 0 aucun)
    const side = b.x <= 0.5 ? -1 : b.x >= right - 0.5 ? 1 : 0
    const shake = Math.hypot(ax, ay)

    if (b.where === 'floor') {
      // le sol s'est éloigné (la fenêtre a grandi vers le bas) : il tombe
      if (b.y < floor - 1) fall()
      // la fenêtre bouge fort : il glisse à l'opposé ; plus fort vers le bas que la pesanteur : il décolle
      else if (ay > GRAVITY) fall(-ax * dt, -(ay - GRAVITY) * dt)
      else {
        if (Math.abs(ax) > SLIP) b.vx -= ax * dt
        b.vx *= Math.exp(-FRICTION * dt)
        if (k.jump && !b.squashed) fall(b.vx, -JUMP)
        if (dx) b.face = dx as 1 | -1
        b.x += (b.vx + (b.squashed ? 0.4 : 1) * dx * WALK) * dt
        if (b.where === 'floor') b.y = floor
        // contre un bord, la flèche du haut : il grimpe
        if (side && dy < 0 && !b.squashed) b.where = 'wall'
      }
    } else if (b.where === 'line') {
      // accroché à un trait : les flèches le font avancer le long, dans leur sens (raide : il grimpe ; plat : il
      // avance suspendu) ; au bout, il passe par-dessus (en montant) ou il tombe ; la barre d'espace, ou s'éloigner
      // d'un trait raide, il lâche
      const here = lines?.near(b.grip.x, b.grip.y, REACH) ?? null
      const len = Math.hypot(dx, dy) || 1
      if (!here || shake > GRIP) fall()
      else if (k.jump) fall(-b.face * 80, -JUMP * 0.8)
      else if (b.steep && dx === -b.face && !dy) fall(-b.face * 40, 0)
      else {
        // (le sens du trait qui va avec les flèches, et sa vitesse : escalade ou suspendu)
        const along = (here.ux * dx + here.uy * dy) / len
        const speed = b.steep ? CLIMB : HANG
        const gx = here.x + here.ux * along * speed * dt
        const gy = here.y + here.uy * along * speed * dt
        const next = lines?.near(gx, gy, REACH) ?? null
        // (au bout : plus de trait là où il va, ou il pousse sans plus avancer, collé au dernier point)
        const stuck =
          !!next && Math.abs(along) > 0.3 && Math.hypot(next.x - here.x, next.y - here.y) < speed * dt * 0.25
        if (!next || stuck) {
          // le bout du trait : en montant, il se hisse par-dessus ; sinon il tombe
          if (here.uy * along < 0) fall(b.face * 140, -420)
          else fall()
        } else {
          b.grip = { x: next.x, y: next.y }
          b.steep = Math.abs(next.uy) > Math.abs(next.ux)
          if (!b.steep && dx) b.face = dx as 1 | -1
          hang(w, h)
          // (redescendu jusqu'au sol : il y reprend pied)
          if (b.y >= floor && dy > 0) Object.assign(b, { where: 'floor', y: floor })
        }
      }
    } else if (b.where === 'wall') {
      // le bord s'est éloigné (la fenêtre a grandi), ou la fenêtre le secoue : il lâche
      if (!side || shake > GRIP) fall(-ax * dt * 0.5, -ay * dt * 0.5)
      else {
        b.face = side === -1 ? -1 : 1
        b.x = side === -1 ? 0 : right
        b.y = Math.min(floor, Math.max(0, b.y + dy * CLIMB * dt))
        if (b.y >= floor && dy > 0) b.where = 'floor'
        // en haut, vers l'intérieur : il passe sous le bord du haut, suspendu ; plus bas, vers l'intérieur : il lâche
        const away = dx === -side && dx !== 0
        if (away && b.y <= 0) b.where = 'ceiling'
        else if (away) fall()
      }
    } else if (b.where === 'ceiling') {
      if (shake > GRIP) fall(-ax * dt * 0.5, -ay * dt * 0.5)
      else {
        if (dx) b.face = dx as 1 | -1
        b.x += dx * HANG * dt
        b.y = 0
        // contre un bord, la flèche du bas : il redescend le long du bord ; ailleurs : il lâche, et tombe
        if (dy > 0) {
          if (side) b.where = 'wall'
          else fall()
        }
      }
    } else {
      // en l'air : encore un saut (deux fois au plus, avant de retoucher quelque chose)
      if (k.jump && b.jumps < AIR_JUMPS) Object.assign(b, { vy: -AGAIN, jumps: b.jumps + 1 })
      // la pesanteur, l'inertie quand la fenêtre bouge, et les flèches le portent encore un peu
      b.vx -= ax * dt
      b.vy += (GRAVITY - ay) * dt
      if (dx) b.face = dx as 1 | -1
      b.x += (b.vx + dx * WALK * 0.7) * dt
      b.y += b.vy * dt
      if (b.x < 0 || b.x > right) {
        b.x = Math.min(right, Math.max(0, b.x))
        b.vx = -b.vx * BOUNCE
      }
      // contre un bord, la flèche du haut : il s'y accroche (en sautant, ou en tombant)
      const touching = b.x <= 0.5 || b.x >= right - 0.5
      if (b.where === 'air' && touching && dy < 0 && b.y < floor) Object.assign(b, { where: 'wall', vx: 0, vy: 0 })
      if (b.where === 'air' && b.y < 0) {
        b.y = 0
        if (dy < 0) Object.assign(b, { where: 'ceiling', vx: 0, vy: 0 })
        else b.vy = Math.abs(b.vy) * BOUNCE
      }
      if (b.where === 'air' && b.y >= floor) Object.assign(b, { y: floor, vy: 0, where: 'floor' })
    }
    // la flèche du haut, un trait à portée de ses mains : d'abord un trait plat juste au-dessus de sa tête (il s'y
    // hisse, suspendu) ; sinon le plus proche autour du haut de son corps, pas sous ses pieds (raide : il se met
    // contre ; plat : il s'y suspend)
    b.cool = Math.max(0, b.cool - dt)
    if (dy < 0 && !b.cool && (b.where === 'floor' || b.where === 'air')) {
      const cx = b.x + w / 2
      const flat = (p: { ux: number; uy: number }) => Math.abs(p.uy) <= Math.abs(p.ux)
      const g =
        lines?.near(cx, b.y, 30, (p) => flat(p) && p.y <= b.y + 4) ??
        lines?.near(cx, b.y + h * GRIP_AT, w * 0.9) ??
        null
      if (g && g.y < b.y + h * 0.7) {
        b.steep = Math.abs(g.uy) > Math.abs(g.ux)
        if (b.steep) b.face = g.x >= cx ? 1 : -1
        Object.assign(b, { where: 'line', grip: { x: g.x, y: g.y }, vx: 0, vy: 0 })
        hang(w, h)
      }
    }
    // (il touche quelque chose : ses sauts en l'air reviennent)
    if (b.where !== 'air') b.jumps = 0
    // (toujours dans la fenêtre, même si elle a rétréci)
    b.x = Math.min(right, Math.max(0, b.x))
    b.y = Math.min(floor, Math.max(0, b.y))
    const moved = Math.hypot(b.x - was.x, b.y - was.y)
    b.moving = moved > 0.01 && b.where !== 'air'
    b.trip += moved
  }

  return { body: b, step, start, fall, drag }
}
