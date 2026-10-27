import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { FLOOR, feel } from './spin'

// Le sol (le réglage « sol », voir settings.ts) : ce sur quoi les toupies tournent, qu'on voit, et qui les freine.
// - papier : la page claire ; la table invisible n'en garde que les ombres ;
// - miroir : une glace où les toupies se reflètent, la tête en bas ; elles y glissent longtemps.

export const GROUNDS = ['papier', 'miroir'] as const
export type Ground = (typeof GROUNDS)[number]

// combien la toupie perd de vitesse par seconde, et ce que le sol freine son glissement
const FEEL: Record<Ground, { loss: number; glide: number }> = {
  papier: { loss: 0.3, glide: 0.6 },
  miroir: { loss: 0.15, glide: 0.25 },
}

export function ground(scene: THREE.Scene) {
  const plane = () => new THREE.PlaneGeometry(400, 400)
  const lay = (m: THREE.Mesh, y: number) => {
    m.rotation.x = -Math.PI / 2
    m.position.y = y
    m.receiveShadow = true
    scene.add(m)
    return m
  }
  // les ombres seules (sur le papier, sur le miroir)
  const shade = new THREE.ShadowMaterial({ opacity: 0.16 })
  lay(new THREE.Mesh(plane(), shade), FLOOR)
  // la glace : un vrai reflet de la scène, un peu teinté (sous les ombres)
  const glass = new Reflector(plane(), {
    color: '#b4b2ae',
    textureWidth: Math.min(2048, innerWidth * devicePixelRatio),
    textureHeight: Math.min(2048, innerHeight * devicePixelRatio),
  })
  lay(glass, FLOOR - 0.002)

  // (la glace reflète la pièce : derrière les toupies, le fond de la page)
  const page = new THREE.Color(getComputedStyle(document.querySelector('.tp')!).backgroundColor)

  return (kind: Ground) => {
    glass.visible = kind === 'miroir'
    scene.background = glass.visible ? page : null
    Object.assign(feel, FEEL[kind])
  }
}
