import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mesh, type Mascot } from './parts'

// A mascot's little stage, in its own canvas: a studio light (a room reflected in the varnish, a key light, a cool
// rim), a soft shadow on the floor. It floats, sways, blinks now and then; still (for whoever asked for less
// motion), it holds a three-quarter pose.

function blobShadow() {
  const canvas = Object.assign(document.createElement('canvas'), { width: 128, height: 128 })
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(20,30,50,.28)')
  gradient.addColorStop(1, 'rgba(20,30,50,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const floor = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  return mesh(new THREE.PlaneGeometry(1.9, 1.9), floor, { position: [0, -1.12, 0], rotation: [-Math.PI / 2, 0, 0], scale: [1, 0.45, 1] })
}

export function stage(canvas: HTMLCanvasElement, mascot: Mascot, still: boolean) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d8, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-2, 3, 4)
  const rim = new THREE.DirectionalLight(0xcfe6ff, 1.6)
  rim.position.set(2.5, 1.5, -3)
  scene.add(key, rim)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0.25, 6)
  camera.lookAt(0, 0.05, 0)
  const holder = new THREE.Group()
  holder.add(mascot.root)
  scene.add(holder, blobShadow())

  // (each starts at another moment, so that they do not move in step)
  const offset = Math.random() * 10
  let nextBlink = 1 + Math.random() * 3
  const render = (now: number) => {
    const t = still ? 1.05 : now / 1000 + offset
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== Math.round(width * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    holder.position.y = Math.sin(t * 2.2) * 0.07
    holder.rotation.y = still ? -0.32 : Math.sin(t * 0.7) * 0.4
    holder.rotation.z = Math.sin(t * 1.3) * 0.04
    // a blink: the eyes close and open in 0.16 s, every 2 to 5 s
    if (!still && t > nextBlink + 0.16) nextBlink = t + 2 + Math.random() * 3
    const phase = (t - nextBlink) / 0.16
    const open = still || phase < 0 || phase > 1 ? 1 : Math.max(0.08, Math.abs(phase * 2 - 1))
    for (const eye of mascot.eyes) eye.scale.y = open
    mascot.update(t)
    renderer.render(scene, camera)
    if (!still) requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
  // (a still pose is drawn again when the page changes size)
  if (still) addEventListener('resize', () => requestAnimationFrame(render))
}
