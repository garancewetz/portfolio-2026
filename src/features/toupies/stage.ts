import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { sheet } from '@/features/carnet/sheet'
import { ground } from './ground'
import { FLOOR } from './spin'

// La scène : la page est une table plate qui file au loin jusqu'à un horizon ; une lumière blanche au-dessus, un peu
// devant, porte les ombres des toupies ; le sol (voir ground.ts) ; une pièce douce autour se reflète dans la tôle
// vernie des toupies. On la regarde de côté ou de dessus (le réglage « vue » : la vue y glisse doucement) ; sinon, la
// vue ne bouge pas.

export const VIEWS = ['côté', 'dessus'] as const
export type View = (typeof VIEWS)[number]

export function stage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 400)
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.65
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))
  // (le soleil : ses ombres couvrent toute la profondeur, jusqu'au fond)
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(-1, 30, 6)
  sun.target.position.set(0, 0, -40)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.radius = 6
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 110, bottom: -80, near: 1, far: 200 })
  scene.add(sun, sun.target)
  ground(scene)
  let view: View = 'côté'

  // où est l'œil, et ce qu'il regarde : là où il va, et là où il en est (il y glisse)
  const goal = { eye: new THREE.Vector3(), at: new THREE.Vector3() }
  const now = { eye: new THREE.Vector3(), at: new THREE.Vector3() }
  // (le recul de la vue de côté : un écran en hauteur recule, pour que les toupies tiennent en largeur)
  const back = () => 11 * Math.max(1, 1.5 / camera.aspect)
  function aim() {
    const b = back()
    if (view === 'côté') {
      // (d'assez bas, presque à hauteur de toupie : le plan de la page file jusqu'à un horizon qu'on voit, en haut de
      // l'écran ; une toupie poussée au fond y devient toute petite, mais reste entière)
      goal.eye.set(0, 1.7, b)
      goal.at.set(0, 1.7 - b * Math.tan((5.5 * Math.PI) / 180), 0)
    } else {
      // (de haut, presque à l'aplomb : toutes les toupies, celles de devant et celles de l'arc, leurs couleurs à plat,
      // en rond)
      goal.eye.set(0, 3.4 * b, 0.05 * b)
      goal.at.set(0, FLOOR, -0.6 * b)
    }
  }
  function place() {
    camera.position.copy(now.eye)
    camera.lookAt(now.at)
  }

  function resize() {
    const { w, h } = sheet()
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    aim()
  }
  addEventListener('resize', resize)
  resize()
  now.eye.copy(goal.eye)
  now.at.copy(goal.at)
  place()

  return {
    renderer,
    scene,
    camera,
    // changer de vue (elle y glisse)
    look(next: View) {
      view = next
      aim()
    },
    // la vue glisse vers là où elle va
    step(dt: number) {
      const k = 1 - Math.exp(-dt * 3)
      now.eye.lerp(goal.eye, k)
      now.at.lerp(goal.at, k)
      place()
    },
  }
}
