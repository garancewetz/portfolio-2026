import { useEffect } from 'react'
import * as THREE from 'three'
import type { RippleProps } from './Ripple'
import './CardFX.css'

// Effet au survol des cartes : un seul canvas WebGL vient se poser sur l'image survolée. Au repos, il est
// identique à l'image (mêmes couleurs, même netteté) ; c'est le mouvement de la souris qui crée la
// distorsion (ondulation autour du curseur, léger décalage RGB), qui se calme quand la souris s'arrête.
// Ainsi, le passage de l'image au canvas est invisible.
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
  uniform vec2 uCrop; // la part de l'image visible (recadrée comme object-fit: cover)…
  uniform vec2 uCropAt; // … et où (object-position, de 0 à 1 depuis le coin haut gauche)
  varying vec2 vUv;

  // du point de la case au point de l'image
  vec2 crop(vec2 p) {
    vec2 off = uCropAt * (1.0 - uCrop);
    return vec2(off.x + p.x * uCrop.x, 1.0 - (off.y + (1.0 - p.y) * uCrop.y));
  }

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
    float r = texture2D(uTex, crop(uv + vec2(shift, 0.0))).r;
    float g = texture2D(uTex, crop(uv)).g;
    float b = texture2D(uTex, crop(uv - vec2(shift, 0.0))).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`

// root : le conteneur à surveiller ; item : le sélecteur des éléments survolables (une capture .shot, ou un
// élément qui en contient une).
export default function CardFX({ root, item }: RippleProps) {
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
    // Couleurs transmises telles quelles (aucune conversion à l'entrée ni à la sortie) : le canvas au
    // repos a exactement les couleurs de l'image affichée par le navigateur
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    box.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const uniforms: {
      uTex: { value: THREE.Texture | null }
      uMouse: { value: THREE.Vector2 }
      uHover: { value: number }
      uTime: { value: number }
      uAspect: { value: number }
      uCrop: { value: THREE.Vector2 }
      uCropAt: { value: THREE.Vector2 }
    } = {
      uTex: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
      uCrop: { value: new THREE.Vector2(1, 1) },
      uCropAt: { value: new THREE.Vector2(0.5, 0) },
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment }),
    )
    scene.add(mesh)

    const loader = new THREE.TextureLoader()
    const cache = new Map<string, THREE.Texture>()
    const textureFor = (src: string): THREE.Texture => {
      if (!cache.has(src)) {
        const t: THREE.Texture = loader.load(src, () => (t.userData.ready = true))
        t.colorSpace = THREE.NoColorSpace
        // mipmaps : l'image réduite est aussi nette (et pas plus) que celle du navigateur
        t.generateMipmaps = true
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.anisotropy = renderer.capabilities.getMaxAnisotropy()
        cache.set(src, t)
      }
      return cache.get(src)!
    }
    // Une vidéo (dans la fiche) : sa texture suit la vidéo image par image ; prête dès qu'elle a une image
    const videos = new Map<HTMLVideoElement, THREE.VideoTexture>()
    const videoTexture = (v: HTMLVideoElement): THREE.Texture => {
      if (!videos.has(v)) {
        const t = new THREE.VideoTexture(v)
        t.colorSpace = THREE.NoColorSpace
        videos.set(v, t)
      }
      const t = videos.get(v)!
      t.userData.ready = v.readyState >= 2
      return t
    }
    // Précharge toutes les images survolables, pour qu'elles soient prêtes au premier survol
    container.querySelectorAll<HTMLImageElement>(`${item} img`).forEach((img) => textureFor(img.currentSrc || img.src))

    let target: HTMLElement | null = null // l'élément .shot survolé
    let media: HTMLImageElement | HTMLVideoElement | null = null // son image (ou sa vidéo)
    // L'image est-elle recadrée dans sa case (object-fit: cover) ? La part visible, en largeur et en hauteur
    const fitCrop = () => {
      const w = media instanceof HTMLVideoElement ? media.videoWidth : media?.naturalWidth
      const h = media instanceof HTMLVideoElement ? media.videoHeight : media?.naturalHeight
      if (!w || !h || !boxW || !boxH) return uniforms.uCrop.value.set(1, 1)
      const [x, y] = getComputedStyle(media!).objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5))
      uniforms.uCropAt.value.set(x ?? 0.5, y ?? 0)
      const box = boxW / boxH
      const img = w / h
      if (img > box) uniforms.uCrop.value.set(box / img, 1)
      else uniforms.uCrop.value.set(1, img / box)
    }
    let energy = 0 // intensité de la distorsion : monte quand la souris bouge, retombe quand elle s'arrête
    let goal = 0
    let last: { x: number; y: number } | null = null // dernière position de la souris (pour sa vitesse)
    const mouse = new THREE.Vector2(0.5, 0.5)

    // Pose le canvas sur la capture. Renvoie true si la capture vient de changer de taille
    // (la carte bouge ou change de taille) : l'effet attend alors qu'elle soit stable pour s'afficher,
    // sinon il suivrait avec une image de retard et donnerait une image fantôme qui tremble.
    let boxW = 0
    let boxH = 0
    const place = (): boolean => {
      if (!target) return false
      const r = target.getBoundingClientRect()
      box.style.transform = `translate(${r.left}px, ${r.top}px)`
      if (boxW === r.width && boxH === r.height) return false
      boxW = r.width
      boxH = r.height
      box.style.width = `${r.width}px`
      box.style.height = `${r.height}px`
      renderer.setSize(r.width, r.height, false)
      uniforms.uAspect.value = r.width / r.height
      fitCrop()
      return true
    }
    let stable = 0 // nombre d'images consécutives sans changement de taille

    // Après un scroll, le navigateur envoie de faux mouvements de souris (pour mettre à jour le survol des
    // éléments passés sous la souris immobile) : on les ignore jusqu'au premier vrai mouvement, sinon l'effet
    // revient pendant le scroll et suit la capture avec une image de retard (on voit l'image dessous)
    let scrolled = false
    const onOver = (e: PointerEvent) => {
      if (scrolled) return
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(item)
      const shot = card?.matches('.shot') ? card : card?.querySelector<HTMLElement>('.shot')
      const m = shot?.querySelector<HTMLImageElement | HTMLVideoElement>('img, video')
      if (!shot || !m) return
      // (même capture, mais une autre image : dans la fiche, en passant d'un projet à l'autre, React garde le
      // même élément et n'en change que l'image)
      const tex = m instanceof HTMLVideoElement ? videoTexture(m) : textureFor(m.currentSrc || m.src)
      if (shot !== target || tex !== uniforms.uTex.value) {
        target = shot
        media = m
        uniforms.uTex.value = tex
        box.style.borderRadius = getComputedStyle(shot).borderRadius
        place()
        fitCrop()
        stable = 0
      }
      goal = 1
    }
    const onOut = (e: PointerEvent) => {
      const from = (e.target as Element | null)?.closest?.(item)
      if (from && !from.contains(e.relatedTarget as Node | null)) goal = 0
    }
    const onMove = (e: PointerEvent) => {
      if (scrolled) {
        if (!e.movementX && !e.movementY) return
        scrolled = false
      }
      // Si la souris était déjà sur une carte au chargement, ou si l'image a changé sous la souris (fiche suivante
      // au clavier), aucun « pointerover » n'arrive : on rattrape ici.
      if (container.contains(e.target as Node | null)) onOver(e)
      if (!target) return
      const r = target.getBoundingClientRect()
      mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
      // plus la souris va vite, plus ça ondule
      if (goal && last) energy = Math.min(1, energy + Math.hypot(e.clientX - last.x, e.clientY - last.y) / 160)
      last = { x: e.clientX, y: e.clientY }
    }
    // Pendant le scroll, les cartes défilent sous la souris : l'effet se cacherait mal. On le masque donc
    // dès qu'on scrolle ; il revient au prochain vrai mouvement de souris sur une carte (voir onMove).
    const onScroll = () => {
      scrolled = true
      if (!target && goal === 0) return
      goal = 0
      energy = 0
      box.style.opacity = '0'
    }
    container.addEventListener('pointerover', onOver)
    container.addEventListener('pointerout', onOut)
    addEventListener('pointermove', onMove)
    addEventListener('scroll', onScroll, { passive: true })

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      uniforms.uTime.value += dt
      // la distorsion retombe doucement (≈ 0,5 s) quand la souris ne bouge plus
      energy *= Math.exp(-dt * 4)
      if (energy < 0.002) energy = 0
      uniforms.uMouse.value.lerp(mouse, Math.min(1, dt * 10))
      let visible = Boolean(target && goal && uniforms.uTex.value?.userData.ready)
      if (visible) {
        // pendant que la carte change de taille : pas de canvas, on montre l'image elle-même,
        // et la distorsion reste à zéro (le canvas apparaîtra identique à l'image)
        stable = place() ? 0 : stable + 1
        visible = stable >= 2
        if (!visible) energy = 0
        uniforms.uHover.value = energy
        if (visible) renderer.render(scene, camera)
      }
      box.style.opacity = visible ? '1' : '0'
      if (!goal) last = null
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
      videos.forEach((t) => t.dispose())
      mesh.geometry.dispose()
      mesh.material.dispose()
      renderer.dispose()
      box.remove()
    }
  }, [root, item])

  return null
}
