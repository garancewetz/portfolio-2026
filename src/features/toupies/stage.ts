import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { sheet } from '@/features/carnet/sheet'
import { ground } from './ground'
import { FLOOR } from './spin'

// The stage: the page is a flat table running off to a horizon; a white light above, slightly in front, casts
// the tops' shadows; the ground (see ground.ts); a soft room around is reflected in the tops' varnished
// tinplate. You look at it from the side or from above (the « vue » setting: the view glides there gently);
// otherwise, the view does not move.

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
  // (the sun: its shadows cover the whole depth, to the very back)
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

  // where the eye is, and what it looks at: where it is going, and where it stands (it glides there)
  const goal = { eye: new THREE.Vector3(), at: new THREE.Vector3() }
  const now = { eye: new THREE.Vector3(), at: new THREE.Vector3() }
  // (the side view's distance: a tall screen steps back, so the tops fit in the width)
  const back = () => 11 * Math.max(1, 1.5 / camera.aspect)
  function aim() {
    const b = back()
    if (view === 'côté') {
      // (from fairly low, almost at top height: the page's plane runs to a visible horizon, at the top of the screen;
      // a top pushed to the back becomes tiny there, but stays whole)
      goal.eye.set(0, 1.7, b)
      goal.at.set(0, 1.7 - b * Math.tan((5.5 * Math.PI) / 180), 0)
    } else {
      // (from high up, almost straight above: all the tops, those in front and those on the arc, their colours flat,
      // round)
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
    // change the view (it glides there)
    look(next: View) {
      view = next
      aim()
    },
    // the view glides towards where it is going
    step(dt: number) {
      const k = 1 - Math.exp(-dt * 3)
      now.eye.lerp(goal.eye, k)
      now.at.lerp(goal.at, k)
      place()
    },
  }
}
