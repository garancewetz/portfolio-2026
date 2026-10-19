import { useEffect } from 'react'
import * as THREE from 'three'

// Effet au survol des cartes : un seul canvas WebGL vient se poser sur l'image survolée
// et la déforme en ondulation autour du curseur, avec un léger décalage des couleurs (RGB).
const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`
const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 d = uv - uMouse;
    d.x *= uAspect;
    float dist = length(d);

    // Ondulation qui part du curseur et s'atténue avec la distance
    float wave = sin(dist * 32.0 - uTime * 4.5) * exp(-dist * 4.0) * 0.022 * uHover;
    // Petite loupe sous le curseur
    float lens = -0.07 * uHover * smoothstep(0.35, 0.0, dist);
    vec2 dir = dist > 0.0001 ? normalize(d) : vec2(0.0);
    dir.x /= uAspect;
    uv += dir * (wave + lens * dist);

    float shift = 0.012 * uHover * exp(-dist * 2.5);
    float r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - vec2(shift, 0.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`

// root : le conteneur à surveiller ; item : le sélecteur des éléments survolables (une capture .shot, ou un
// élément qui en contient une).
export default function CardFX({ root, item }) {
  useEffect(() => {
    const container = root.current
    if (!container) return
    // Conteneur créé ici (et non par React) : il flotte au-dessus de la capture survolée
    const box = document.createElement('div')
    box.className = 'cardfx'
    box.setAttribute('aria-hidden', 'true')
    container.append(box)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    box.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const uniforms = {
      uTex: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment }),
    )
    scene.add(mesh)

    const loader = new THREE.TextureLoader()
    const cache = new Map()
    const textureFor = (src) => {
      if (!cache.has(src)) {
        const t = loader.load(src, () => (t.userData.ready = true))
        t.colorSpace = THREE.SRGBColorSpace
        t.minFilter = THREE.LinearFilter
        cache.set(src, t)
      }
      return cache.get(src)
    }
    // Précharge toutes les images survolables, pour qu'elles soient prêtes au premier survol
    container.querySelectorAll(`${item} img`).forEach((img) => textureFor(img.currentSrc || img.src))

    let target = null // l'élément .shot survolé
    let hover = 0
    let goal = 0
    const mouse = new THREE.Vector2(0.5, 0.5)

    // Pose le canvas sur la capture. Renvoie true si la capture vient de changer de taille
    // (la carte grossit ou rétrécit) : l'effet attend alors qu'elle soit stable pour s'afficher,
    // sinon il suivrait avec une image de retard et donnerait une image fantôme qui tremble.
    const place = () => {
      const r = target.getBoundingClientRect()
      box.style.transform = `translate(${r.left}px, ${r.top}px)`
      if (box._w === r.width && box._h === r.height) return false
      box._w = r.width
      box._h = r.height
      box.style.width = `${r.width}px`
      box.style.height = `${r.height}px`
      renderer.setSize(r.width, r.height, false)
      uniforms.uAspect.value = r.width / r.height
      return true
    }
    let stable = 0 // nombre d'images consécutives sans changement de taille

    const onOver = (e) => {
      const card = e.target.closest?.(item)
      const shot = card?.matches('.shot') ? card : card?.querySelector('.shot')
      const img = shot?.querySelector('img')
      if (!img) return
      if (shot !== target) {
        target = shot
        uniforms.uTex.value = textureFor(img.currentSrc || img.src)
        box.style.borderRadius = getComputedStyle(shot).borderRadius
        place()
        stable = 0
      }
      goal = 1
    }
    const onOut = (e) => {
      const from = e.target.closest?.(item)
      if (from && !from.contains(e.relatedTarget)) goal = 0
    }
    const onMove = (e) => {
      // Si la souris était déjà sur une carte au chargement, aucun « pointerover » n'arrive : on rattrape ici.
      if (goal === 0 && container.contains(e.target)) onOver(e)
      if (!target) return
      const r = target.getBoundingClientRect()
      mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
    }
    // Pendant le scroll, les cartes défilent sous la souris : l'effet se cacherait mal. On le masque donc
    // dès qu'on scrolle ; il revient au prochain mouvement de souris sur une carte (voir onMove).
    const onScroll = () => {
      if (!target && goal === 0) return
      goal = 0
      hover = 0
      box.style.opacity = 0
    }
    container.addEventListener('pointerover', onOver)
    container.addEventListener('pointerout', onOut)
    addEventListener('pointermove', onMove)
    addEventListener('scroll', onScroll, { passive: true })

    const clock = new THREE.Clock()
    let raf
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      uniforms.uTime.value += dt
      // Réactif : l'effet s'installe en ~0,2 s et disparaît encore plus vite quand la souris sort
      hover += (goal - hover) * Math.min(1, dt * (goal ? 16 : 24))
      if (!goal && hover < 0.02) hover = 0
      uniforms.uHover.value = hover
      uniforms.uMouse.value.lerp(mouse, Math.min(1, dt * 10))
      let visible = target && hover > 0.01 && uniforms.uTex.value?.userData.ready
      if (visible) {
        stable = place() ? 0 : stable + 1
        // pendant que la carte change de taille : pas d'effet, on montre l'image elle-même
        visible = stable >= 2
        if (visible) renderer.render(scene, camera)
      }
      box.style.opacity = visible ? 1 : 0
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('pointerover', onOver)
      container.removeEventListener('pointerout', onOut)
      removeEventListener('pointermove', onMove)
      removeEventListener('scroll', onScroll)
      cache.forEach((t) => t.dispose())
      mesh.geometry.dispose()
      mesh.material.dispose()
      renderer.dispose()
      box.remove()
    }
  }, [root, item])

  return null
}
