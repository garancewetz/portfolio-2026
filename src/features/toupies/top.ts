import * as THREE from 'three'
import { motifs, VARIANTS, type Variant } from './motifs'
import { toy } from './toy'

// Une toupie à pompe en tôle, en 3D : un corps large et plat imprimé (voir motifs.ts) ; le col, la poignée et le
// pied en plastique, la tige torsadée de la pompe (voir toy.ts).

// le profil (rayon, hauteur), du haut au bas : deux coupelles de tôle bombées, larges et plates, réunies par un
// rebord ; le haut et le bas, cachés par le col et le pied (posés en TOP et BOTTOM)
const TOP = 0.44
const BOTTOM = -0.44
const PROFILE = [
  [0, 0.44], [0.26, 0.44], [0.3, 0.43], [0.5, 0.36], [0.75, 0.24], [0.93, 0.13], [1.0, 0.075], [1.05, 0.045],
  [1.055, 0.0], [1.0, -0.025], [0.92, -0.09], [0.72, -0.22], [0.5, -0.34], [0.32, -0.42], [0.28, -0.44], [0, -0.44],
]
function profile() {
  const samples = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y))).getSpacedPoints(400)
  // pour chaque point, son angle depuis le haut (vu du centre) ; et où est le bord, le long du profil
  const angles = samples.map((p) => Math.atan2(p.x, p.y))
  const edge = samples.reduce((best, p, k) => (p.x > samples[best].x ? k : best), 0) / (samples.length - 1)
  // le point de la surface dans une direction : polar (depuis l'axe, en haut) et ra (autour de l'axe)
  const onSurface = (polar: number, ra: number) => {
    let k = 1
    while (k < angles.length - 1 && angles[k] < polar) k++
    const t = angles[k] > angles[k - 1] ? (polar - angles[k - 1]) / (angles[k] - angles[k - 1]) : 0
    const r = samples[k - 1].x + (samples[k].x - samples[k - 1].x) * t
    const y = samples[k - 1].y + (samples[k].y - samples[k - 1].y) * t
    return new THREE.Vector3(r * Math.sin(ra), y, r * Math.cos(ra))
  }
  return { samples, edge, onSurface }
}

// la moyenne de l'image le long du tour, comme pour l'œil (uBlur : la portion de tour parcourue pendant que l'œil
// garde la lumière, voir spin.ts) ; elle se fait sur la lumière elle-même (l'image est décodée en intensités réelles
// avant d'être lue) : noir et blanc à parts égales donnent un gris clair. Soixante-quatre échantillons, pour
// qu'aucune fausse rayure n'apparaisse. Les lampes aussi (l'image de ce qui brille) : leurs points s'étirent en
// traits, puis en anneaux de néon
function eyeBlur(material: THREE.MeshPhysicalMaterial, blur: { value: number }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBlur = blur
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBlur;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec4 sum = vec4(0.0);
          for (int i = 0; i < 64; i++) sum += texture2D(map, vMapUv + vec2((float(i) / 63.0 - 0.5) * uBlur, 0.0));
          diffuseColor *= sum / 64.0;
        #endif`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#ifdef USE_EMISSIVEMAP
          vec4 glow = vec4(0.0);
          for (int i = 0; i < 64; i++)
            glow += texture2D(emissiveMap, vEmissiveMapUv + vec2((float(i) / 63.0 - 0.5) * uBlur, 0.0));
          totalEmissiveRadiance *= glow.rgb / 64.0;
        #endif`,
      )
  }
}

// blur : la portion de tour fondue, de 0 (le motif net) à 1 (une seule couleur) ; glow : ses lampes (0 à 1)
export function top(variant: Variant) {
  const d = VARIANTS[variant]
  const group = new THREE.Group()
  const { samples, edge, onSurface } = profile()
  // le miroir : une tôle polie, sans rien d'imprimé, qui reflète ce qui l'entoure — la page, les autres toupies ; une
  // caméra posée en son centre regarde tout autour (voir reflect)
  const cube = d.kind === 'miroir' ? new THREE.CubeCamera(0.05, 200, new THREE.WebGLCubeRenderTarget(256)) : null
  const print = cube ? null : motifs(edge, variant)
  const skin = new THREE.MeshPhysicalMaterial(
    !print
      ? { color: '#ffffff', metalness: 1, roughness: 0.03 }
      : {
          map: print.map,
          metalness: 0.25,
          roughness: 0.35,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          emissiveMap: print.glow,
          emissive: print.glow ? '#ffffff' : '#000000',
          emissiveIntensity: 0,
        },
  )
  const blur = { value: 0 }
  eyeBlur(skin, blur)
  // (le profil, du bas vers le haut : les faces regardent vers l'extérieur, et l'image a son haut en haut)
  group.add(new THREE.Mesh(new THREE.LatheGeometry(samples.slice().reverse(), 180), skin))
  // le col, la tige, la poignée, le pied, les fentes du sifflet (voir toy.ts)
  const { plunger, slots, slotsBlur } = toy(group, TOP, BOTTOM, d.plastic)
  slots(onSurface)
  group.traverse((o) => (o.castShadow = true))
  return {
    group,
    plunger,
    // (du centre à la pointe, sous le pied ; et le rayon du bord : où elle touche la table quand elle est couchée)
    tip: -BOTTOM + 0.48,
    rim: Math.max(...samples.map((p) => p.x)),
    blur(b: number) {
      blur.value = d.blur ? b : 0
      slotsBlur(d.blur ? b : 0)
    },
    // (le miroir : ce qu'il reflète, vu depuis son centre — sans lui-même)
    reflect: cube
      ? (renderer: THREE.WebGLRenderer, scene: THREE.Scene) => {
          group.getWorldPosition(cube.position)
          group.visible = false
          cube.update(renderer, scene)
          group.visible = true
          // (avant sa première image, elle reflète la pièce de la scène : jamais un miroir noir)
          skin.envMap = cube.renderTarget.texture
        }
      : null,
    // (une lampe qui tourne vite trace son anneau sans pâlir : la lumière d'un point se répartit sur tout le tour,
    // mais une vraie lampe est si vive que l'anneau reste éclatant)
    glow(l: number) {
      skin.emissiveIntensity = l * 2.2 * (1 + 7 * blur.value)
    },
  }
}
