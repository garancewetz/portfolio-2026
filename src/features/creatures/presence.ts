// Le visiteur : la souris (ou le doigt) sur la page. Les créatures le remarquent quand il passe près d'elles, chacune
// à sa façon : les curieuses s'approchent et le regardent, les timides s'écartent en pressant le pas, les calmes ne
// s'en soucient pas.

// où il est : x depuis la gauche, y depuis le bas de la page ; here : il est sur la page
export const pointer = { x: 0, y: 0, here: false }

export function watch(room: HTMLElement) {
  const at = (e: PointerEvent) => {
    const r = room.getBoundingClientRect()
    pointer.x = e.clientX - r.left
    pointer.y = r.bottom - e.clientY
    pointer.here = true
  }
  room.addEventListener('pointermove', at)
  room.addEventListener('pointerdown', at)
  room.addEventListener('pointerleave', () => (pointer.here = false))
}

export type Temper = 'curious' | 'shy' | 'calm'

// le caractère de chacune (par son nom)
const TEMPER: Record<string, Temper> = {
  souris: 'shy',
  hibou: 'shy',
  pingouin: 'shy',
  'kodama-lièvre': 'shy',
  ourson: 'curious',
  loutre: 'curious',
  robot: 'curious',
  gobelin: 'curious',
  'yéti oreilles sans bras': 'curious',
  paresseux: 'calm',
}
export const temper = (name: string): Temper => TEMPER[name] ?? 'calm'

// à quelle distance elles le remarquent (en pixels) ; où les curieuses s'arrêtent pour le regarder
export const NOTICE = 240
const CLOSE = 36

// ce qu'elle fait quand il est près d'elle (dx : de combien, de quel côté) : où elle se tourne ; si elle s'arrête pour
// le regarder, ou combien de temps elle marche ; à quelle allure (null : elle ne s'en soucie pas)
export function react(mood: Temper, dx: number, dir: number) {
  // (la curieuse vient le voir, et s'arrête tout près, tournée vers lui)
  if (mood === 'curious') return { dir: Math.sign(dx) || dir, stop: Math.abs(dx) <= CLOSE, walk: 1, hurry: 1 }
  // (la timide s'écarte, en pressant le pas)
  if (mood === 'shy' && Math.abs(dx) < NOTICE * 0.7) return { dir: -Math.sign(dx) || dir, stop: false, walk: 1.5, hurry: 1.9 }
  return null
}
