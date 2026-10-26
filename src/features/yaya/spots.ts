// Où est Yaya ? Les cachettes (voir scene.ts), dans l'ordre où on la cherche : ses pieds (x, y), sa taille (en
// part de la hauteur de l'écran), ce qui la cache en partie (un des feuillages, ou les maisons du village) — sans
// rien, elle est devant tout —, et parfois la maison derrière laquelle elle est tout entière. Les morceaux du
// collage s'écartent un peu sous la souris (voir push.ts) : c'est en fouillant qu'on la découvre. La dernière n'est
// pas une cachette : elle apparaît en grand, devant.

export type Rect = { x: number; y: number; w: number; h: number }
export type Layout = { m1: Rect; m2: Rect; m3: Rect; village: Rect[]; leaves: Rect[] }
export type Spot = { x: number; y: number; tall: number; under?: number | 'village'; behind?: number }

// l'église (la maison au clocher, la cinquième)
export const CHURCH = 4
// Yaya, détourée (voir scene.ts) : la hauteur de ses chaussures dans l'image, en part de sa hauteur
export const FEET = 0.88
// cachée derrière un bord (en y), avec seulement le haut d'elle qui dépasse (part : la part de sa hauteur visible)
const peek = (edge: number, H: number, tall: number, part: number) => edge + H * tall * (FEET - part)

export const SPOTS: ((W: number, H: number, L: Layout) => Spot)[] = [
  // 1. derrière le buisson du milieu : sa tête dépasse (en poussant le buisson, ses épaules)
  (_W, H, L) => ({ x: L.leaves[2].x + L.leaves[2].w * 0.62, y: peek(L.leaves[2].y, H, 0.17, 0.2), tall: 0.17, under: 2 }),
  // 2. debout tout en haut de la tour du clocher (dans la photo, la tour est aux deux tiers de la largeur, son
  // sommet un peu sous le haut)
  (_W, _H, L) => ({ x: L.village[CHURCH].x + L.village[CHURCH].w * 0.69, y: L.village[CHURCH].y + L.village[CHURCH].h * 0.05, tall: 0.06 }),
  // 3. tout entière derrière le grand buisson de droite, près de son bord gauche
  (W, H, L) => ({ x: L.leaves[4].x + W * 0.026, y: H * 0.98, tall: 0.3, under: 4 }),
  // 4. toute petite, sur la colline au bord du dernier plan de montagne, à gauche
  (W, _H, L) => ({ x: W * 0.12, y: L.m3.y + 1, tall: 0.035 }),
  // 5. derrière l'église, tout près de son bord droit (en la poussant vers la gauche, on la voit)
  (_W, _H, L) => ({ x: L.village[CHURCH].x + L.village[CHURCH].w * 0.84, y: L.village[CHURCH].y + L.village[CHURCH].h * 0.36, tall: 0.06, under: 'village', behind: CHURCH }),
  // 6. derrière le quatrième buisson, tout à gauche de lui
  (_W, H, L) => ({ x: L.leaves[3].x + L.leaves[3].w * 0.12, y: peek(L.leaves[3].y, H, 0.13, 0.32), tall: 0.13, under: 3 }),
  // 7. minuscule, au sommet de la montagne du fond, contre le ciel (dans la photo, le sommet est aux trois cinquièmes
  // de la largeur, à peine sous le haut ; la photo est posée en largeur, sa hauteur suit : 198 / 1772)
  (_W, _H, L) => ({ x: L.m1.x + L.m1.w * 0.62, y: L.m1.y + L.m1.w * (198 / 1772) * 0.13, tall: 0.026 }),
  // 8. tout entière derrière le grand buisson de gauche, près de son bord droit
  (W, H, L) => ({ x: L.leaves[0].x + L.leaves[0].w - W * 0.026, y: H * 0.98, tall: 0.27, under: 0 }),
  // 9. derrière la plus basse des maisons du village : sa tête dépasse des toits
  (_W, H, L) => ({ x: L.village[0].x + L.village[0].w * 0.55, y: peek(L.village[0].y, H, 0.07, 0.02), tall: 0.07, under: 'village' }),
  // 10. derrière le grand buisson de droite, juste le haut de la tête
  (_W, H, L) => ({ x: L.leaves[4].x + L.leaves[4].w * 0.4, y: peek(L.leaves[4].y, H, 0.1, 0.22), tall: 0.1, under: 4 }),
  // et à la fin : au premier plan, en bas à droite, en grand, comme sur une photo où quelqu'un passe la tête
  (W, H) => ({ x: W * 0.84, y: H * 1.45, tall: 0.95 }),
]
// la dernière place : la fin du jeu (et le nombre de fois qu'il faut la trouver avant)
export const LAST = SPOTS.length - 1
