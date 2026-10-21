// Le moteur du feu d'artifice : de vraies étincelles (des particules), dessinées en traits fins sur un canvas
// transparent posé sur le fond papier. Chaque image efface un peu la précédente : les étincelles laissent des
// traînées. Une fusée monte en zigzaguant, en semant de l'or, puis éclate ; les étincelles partent en étoile,
// ralenties par l'air et tirées vers le bas, avec un léger balancement (comme dans l'eau), puis scintillent et
// s'éteignent. Plusieurs sortes de gerbes : pivoine, chrysanthème (qui crépite), saule (doré, qui retombe
// longuement), palmier (de gros bras), anneau.
// Chargé seulement quand on allume le mode (voir Fireworks.tsx).

// les couleurs des captures des projets (les mêmes, dans le même ordre, que le liquide : voir fluid.ts) :
// violet de la grille, rose, bleu, vert, orange, or
const COLORS = ['#7d5cd6', '#d65c96', '#3d7ae0', '#2ea36b', '#f08a3d', '#e8ba30']
const GOLD = 5 // (index de l'or dans COLORS)
// le cœur des traits : la même couleur, à peine éclaircie (qu'elle reste franche, pas blanche)
const CORES = COLORS.map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (v: number) => Math.round(v + (255 - v) * 0.12)
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
})
const STEPS = 4 // nuances d'opacité (les traits sont dessinés par couleur et par nuance, d'un seul coup)
const MAX = 14000 // étincelles à la fois, au plus (sur un grand écran ; moins sur un petit, voir resize)
const TRAIL = 6 // vitesse d'effacement des traînées (plus grand : traînées plus courtes)
const GRAVITY = 140 // px/s²

type Shell = 'peony' | 'chrysanthemum' | 'willow' | 'palm' | 'ring'
const SHELLS: Shell[] = ['peony', 'chrysanthemum', 'willow', 'palm', 'ring', 'peony', 'chrysanthemum']

interface Spark {
  x: number
  y: number
  px: number // position à l'image précédente (le trait va de là à ici)
  py: number
  vx: number
  vy: number
  drag: number // freinage de l'air (par seconde)
  fall: number // part de la gravité
  life: number // secondes restantes
  max: number // durée de vie totale
  color: number
  width: number
  crackle: boolean // crépite en fin de vie
  rocket?: { shell: Shell; size: number; colors: [number, number]; trail: number } // une fusée : éclate en fin de vie
}

export interface Show {
  /** une gerbe, centrée en (x, y) (px CSS, dans la fenêtre) ; size : sa taille (1 = normale) */
  burst(x: number, y: number, size?: number): void
  /** une fusée qui part du bas de l'écran et éclate en (x, y) */
  launch(x: number, y: number, size?: number, trail?: number): void
  /** une image : tout avance de dt secondes ; renvoie le nombre d'étincelles encore en vol */
  step(dt: number): number
  resize(): void
  clear(): void
}

// onBurst : prévenu à chaque explosion (pour le halo de couleur liquide, dessous), avec ses deux couleurs
export function createShow(
  canvas: HTMLCanvasElement,
  onBurst?: (x: number, y: number, size: number, colors: [number, number]) => void,
): Show | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let w = 0
  let h = 0
  // à l'échelle de l'écran : sur un téléphone, des gerbes plus petites (elles tiennent dans l'écran) et moins
  // d'étincelles à la fois
  let scale = 1
  let max = MAX
  let time = 0
  const sparks: Spark[] = []
  const pick = () => Math.floor(Math.random() * COLORS.length)
  const rand = (a: number, b: number) => a + Math.random() * (b - a)

  // (la profondeur : une gerbe proche, plus grande, a aussi des traits plus épais)
  let thick = 1
  const add = (s: Omit<Spark, 'px' | 'py'>) => {
    if (sparks.length < max) sparks.push({ ...s, width: s.width * thick, px: s.x, py: s.y })
  }

  const burst = (
    x: number,
    y: number,
    size = 1,
    shell: Shell = SHELLS[Math.floor(Math.random() * SHELLS.length)],
    colors: [number, number] = [pick(), pick()],
  ) => {
    const [a, b] = colors
    // (le halo suit la taille réelle de la gerbe, à l'échelle de l'écran)
    onBurst?.(x, y, size * scale, colors)
    thick = Math.min(1.6, Math.max(0.6, Math.sqrt(size)))
    try {
      shellOf(x, y, size, shell, a, b)
    } finally {
      thick = 1
    }
  }

  const shellOf = (x: number, y: number, size: number, shell: Shell, a: number, b: number) => {
    const speed = rand(260, 380) * size * scale
    // l'éclair du départ : quelques éclats de la couleur de la gerbe, très rapides et très courts
    for (let i = 0; i < 24; i++) {
      const t = Math.random() * Math.PI * 2
      const v = rand(0.3, 1) * speed * 1.4
      add({
        x,
        y,
        vx: Math.cos(t) * v,
        vy: Math.sin(t) * v,
        drag: 6,
        fall: 0.2,
        life: rand(0.15, 0.3),
        max: 0.3,
        color: a,
        width: 2.5,
        crackle: false,
      })
    }
    if (shell === 'palm') {
      // palmier : quelques gros bras qui montent puis retombent en pluie
      const n = 9
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2 + rand(-0.1, 0.1)
        for (let k = 0; k < 14; k++) {
          const v = speed * rand(0.75, 1.05)
          const life = rand(1.6, 2.3)
          add({
            x,
            y,
            vx: Math.cos(t) * v + rand(-12, 12),
            vy: Math.sin(t) * v + rand(-12, 12),
            drag: 1.3,
            fall: 1,
            life,
            max: life,
            color: k % 4 ? a : GOLD,
            width: 3,
            crackle: k % 4 === 0,
          })
        }
      }
      return
    }
    const n = shell === 'willow' ? 150 : shell === 'ring' ? 90 : 170
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 + rand(-0.04, 0.04)
      // une sphère vue de face : la vitesse projetée varie (anneau : toutes à la même vitesse)
      const v = speed * (shell === 'ring' ? rand(0.95, 1.02) : Math.sqrt(Math.random()) * 0.35 + rand(0.6, 0.68))
      const life = shell === 'willow' ? rand(2.6, 3.6) : rand(1.3, 2.1)
      add({
        x,
        y,
        vx: Math.cos(t) * v,
        vy: Math.sin(t) * v,
        drag: shell === 'willow' ? 2.2 : 1.7,
        fall: shell === 'willow' ? 1.3 : 0.8,
        life,
        max: life,
        color: shell === 'willow' ? GOLD : i % 2 ? a : b,
        width: shell === 'willow' ? 1.6 : 2.2,
        crackle: shell === 'chrysanthemum' || (shell === 'willow' && i % 3 === 0),
      })
    }
    // la pivoine et l'anneau : un cœur d'une autre couleur, plus petit
    if (shell === 'peony' || shell === 'ring') {
      for (let i = 0; i < 60; i++) {
        const t = Math.random() * Math.PI * 2
        const v = speed * rand(0.2, 0.42)
        const life = rand(1, 1.6)
        add({
          x,
          y,
          vx: Math.cos(t) * v,
          vy: Math.sin(t) * v,
          drag: 1.7,
          fall: 0.8,
          life,
          max: life,
          color: b,
          width: 2,
          crackle: false,
        })
      }
    }
  }

  // trail : la couleur de la fusée et de ce qu'elle sème (de l'or, d'habitude)
  const launch = (x: number, y: number, size = 1, trail = GOLD) => {
    // la fusée monte depuis le bas, à peu près à la verticale du point d'éclatement
    const x0 = x + rand(-60, 60)
    const y0 = h + 10
    const dur = rand(0.75, 1.05)
    // (vitesse de départ qui, freinée par la gravité, arrive juste en (x, y) au bout de dur)
    const vy = (y - y0 - 0.5 * GRAVITY * 0.35 * dur * dur) / dur
    add({
      x: x0,
      y: y0,
      vx: (x - x0) / dur,
      vy,
      drag: 0,
      fall: 0.35,
      life: dur,
      max: dur,
      color: trail,
      width: trail === GOLD ? 2.6 : 3.4,
      crackle: false,
      rocket: { shell: SHELLS[Math.floor(Math.random() * SHELLS.length)], size, colors: [pick(), pick()], trail },
    })
  }

  const step = (dt: number) => {
    time += dt
    // les traînées : ce qui est déjà dessiné s'efface un peu
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1 - Math.exp(-dt * TRAIL)
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'

    const born: (() => void)[] = []
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.px = s.x
      s.py = s.y
      const k = Math.exp(-s.drag * dt)
      s.vx *= k
      s.vy = s.vy * k + GRAVITY * s.fall * dt
      // le léger balancement, comme dans l'eau
      s.vx += Math.sin(s.y * 0.02 + time * 3) * 18 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      if (s.rocket) {
        // la fusée sème de l'or (ou sa couleur) derrière elle
        if (Math.random() < 0.8) {
          add({
            x: s.x,
            y: s.y,
            vx: rand(-20, 20),
            vy: rand(10, 50),
            drag: 2,
            fall: 0.6,
            life: rand(0.3, 0.6),
            max: 0.6,
            color: s.rocket.trail,
            width: 1.4,
            crackle: false,
          })
        }
        if (s.life <= 0) {
          const { shell, size, colors } = s.rocket
          const { x, y } = s
          born.push(() => burst(x, y, size, shell, colors))
        }
      } else if (s.crackle && s.life < s.max * 0.3 && Math.random() < 0.25) {
        // crépitement : de minuscules éclats blancs-dorés, au hasard
        add({
          x: s.x,
          y: s.y,
          vx: rand(-60, 60),
          vy: rand(-60, 60),
          drag: 5,
          fall: 0.3,
          life: 0.12,
          max: 0.12,
          color: GOLD,
          width: 1.6,
          crackle: false,
        })
      }
      if (s.life <= 0) {
        sparks[i] = sparks[sparks.length - 1]
        sparks.pop()
      }
    }
    for (const b of born) b()

    // les traits, par couleur et par nuance d'opacité (en fin de vie : elles s'éteignent en scintillant)
    const groups: Spark[][] = Array.from({ length: COLORS.length * STEPS }, () => [])
    for (const s of sparks) {
      let a = s.rocket ? 1 : Math.min(1, s.life / (s.max * 0.5))
      if (!s.rocket && s.life < s.max * 0.2) a *= Math.random() < 0.5 ? 1 : 0.25
      const step = Math.min(STEPS - 1, Math.floor(a * STEPS))
      groups[s.color * STEPS + step].push(s)
    }
    // de la lumière sur la nuit : chaque trait a son halo (large et léger, les halos s'additionnent : là où les
    // étincelles se croisent, ça brille plus) et son cœur (fin, de sa couleur, posé dessus sans s'additionner :
    // les couleurs restent franches, elles ne tournent pas au blanc)
    for (let g = 0; g < groups.length; g++) {
      const list = groups[g]
      if (!list.length) continue
      const c = Math.floor(g / STEPS)
      const alpha = ((g % STEPS) + 1) / STEPS
      ctx.beginPath()
      for (const s of list) {
        ctx.moveTo(s.px, s.py)
        ctx.lineTo(s.x, s.y)
      }
      // (épaisseurs voisines : on garde celle de la première)
      // (le halo à bouts droits : arrondis, en fin de vie, ils feraient des pastilles)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'butt'
      ctx.strokeStyle = COLORS[c]
      ctx.globalAlpha = alpha * 0.18
      ctx.lineWidth = list[0].width * 2.2
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineCap = 'round'
      ctx.strokeStyle = CORES[c]
      ctx.globalAlpha = alpha
      ctx.lineWidth = list[0].width
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    return sparks.length
  }

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    w = innerWidth
    h = innerHeight
    scale = Math.min(1, Math.max(0.45, w / 1300))
    max = Math.round(MAX * Math.min(1, Math.max(0.35, (w * h) / (1400 * 860))))
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  return {
    burst: (x, y, size) => burst(x, y, size),
    launch,
    step,
    resize,
    clear() {
      sparks.length = 0
      ctx.clearRect(0, 0, w, h)
    },
  }
}
