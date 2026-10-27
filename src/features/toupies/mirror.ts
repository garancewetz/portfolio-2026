import * as THREE from 'three'
import { FLOOR, type Spinner } from './spin'

// Les reflets de la toupie miroir (voir top.ts) : une image tout autour d'elle, prise depuis son centre, une image
// sur deux (c'est six vues de la scène à chaque fois). Ce qu'elle reflète : en bas, la page (une vraie feuille, qui
// n'existe que dans ses reflets : à l'écran, la page est le fond, voir ground.ts) avec les ombres ; autour, les autres
// toupies ; en haut, la pièce douce et ses lumières. Les ombres sont celles de la dernière image (on ne les
// recalcule pas six fois de plus).

export function reflections(renderer: THREE.WebGLRenderer, scene: THREE.Scene, tops: Spinner[]) {
  const mirrors = tops.filter((t) => t.reflect)
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      color: getComputedStyle(document.querySelector('.tp')!).backgroundColor,
      roughness: 0.95,
    }),
  )
  paper.rotation.x = -Math.PI / 2
  paper.position.y = FLOOR - 0.002
  paper.receiveShadow = true
  paper.visible = false
  scene.add(paper)
  let odd = false
  return () => {
    odd = !odd
    if (!odd || !mirrors.length) return
    renderer.shadowMap.autoUpdate = false
    // (la feuille, seulement quand la page n'a pas déjà son propre sol : la glace, qui met le fond derrière elle —
    // voir ground.ts)
    paper.visible = !scene.background
    const background = scene.background
    scene.background = scene.environment
    for (const t of mirrors) t.reflect?.(renderer, scene)
    scene.background = background
    paper.visible = false
    renderer.shadowMap.autoUpdate = true
  }
}
