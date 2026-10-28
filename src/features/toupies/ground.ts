import * as THREE from 'three'
import { FLOOR } from './spin'

// Le sol : la page claire (le fond de l'écran) ; la table, invisible, n'en garde que les ombres des toupies.

export function ground(scene: THREE.Scene) {
  const table = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.16 }))
  table.rotation.x = -Math.PI / 2
  table.position.y = FLOOR
  table.receiveShadow = true
  scene.add(table)
}
