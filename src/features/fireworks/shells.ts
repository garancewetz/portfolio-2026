// Les gerbes du feu d'artifice (voir show.ts) : ce qu'une explosion lance comme étincelles, selon sa sorte.

export const GOLD = 5 // (index de l'or dans COLORS, voir show.ts)

export type Shell = 'peony' | 'chrysanthemum' | 'willow' | 'palm' | 'ring'
export const SHELLS: Shell[] = ['peony', 'chrysanthemum', 'willow', 'palm', 'ring', 'peony', 'chrysanthemum']

export interface Spark {
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

export const rand = (a: number, b: number) => a + Math.random() * (b - a)

// une étincelle de plus (sans sa position précédente : elle part d'où elle est)
export type Add = (s: Omit<Spark, 'px' | 'py'>) => void

// les étincelles d'une gerbe de sorte shell en (x, y), lancées à la vitesse speed, dans les couleurs a et b
export function shellOf(add: Add, x: number, y: number, speed: number, shell: Shell, a: number, b: number) {
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
