import * as THREE from 'three'
import { motifs, VARIANTS, type Variant } from './motifs'
import { toy } from './toy'

// A tinplate pump top, in 3D: a wide, flat printed body (see motifs.ts); the collar, the handle and the foot in
// plastic, the plunger's twisted rod (see toy.ts).

// the profile (radius, height), from top to bottom: two domed tinplate cups, wide and flat, joined by a rim; the
// top and the bottom, hidden by the collar and the foot (placed at TOP and BOTTOM)
const TOP = 0.44
const BOTTOM = -0.44
const PROFILE = [
  [0, 0.44], [0.26, 0.44], [0.3, 0.43], [0.5, 0.36], [0.75, 0.24], [0.93, 0.13], [1.0, 0.075], [1.05, 0.045],
  [1.055, 0.0], [1.0, -0.025], [0.92, -0.09], [0.72, -0.22], [0.5, -0.34], [0.32, -0.42], [0.28, -0.44], [0, -0.44],
]
function profile() {
  const samples = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y))).getSpacedPoints(400)
  // for each point, its angle from the top (seen from the centre); and where the rim is, along the profile
  const angles = samples.map((p) => Math.atan2(p.x, p.y))
  const edge = samples.reduce((best, p, k) => (p.x > samples[best].x ? k : best), 0) / (samples.length - 1)
  // the surface point in a direction: polar (from the axis, at the top) and ra (around the axis)
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

// the average of the image along the turn, as for the eye (uBlur: the share of a turn covered while the eye
// holds the light, see spin.ts); it is done on the light itself (the image is decoded into real intensities
// before being read): black and white in equal parts give a light grey. Sixty-four samples, so that no false
// stripe appears. The lamps too (the image of what shines): their dots stretch into lines, then into neon rings
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

// blur: the share of a turn blended, from 0 (the sharp pattern) to 1 (a single colour); glow: its lamps (0 to 1)
export function top(variant: Variant) {
  const d = VARIANTS[variant]
  const group = new THREE.Group()
  const { samples, edge, onSurface } = profile()
  const print = motifs(edge, variant)
  const skin = new THREE.MeshPhysicalMaterial({
    map: print.map,
    metalness: 0.25,
    roughness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    emissiveMap: print.glow,
    emissive: print.glow ? '#ffffff' : '#000000',
    emissiveIntensity: 0,
  })
  const blur = { value: 0 }
  eyeBlur(skin, blur)
  // (the profile, from bottom to top: the faces look outwards, and the image has its top at the top)
  group.add(new THREE.Mesh(new THREE.LatheGeometry(samples.slice().reverse(), 180), skin))
  // the collar, the rod, the handle, the foot, the whistle slits (see toy.ts)
  const { plunger, slots, slotsBlur } = toy(group, TOP, BOTTOM, d.plastic)
  slots(onSurface)
  group.traverse((o) => (o.castShadow = true))
  return {
    group,
    plunger,
    // (from the centre to the tip, under the foot; and the rim's radius: where it touches the table when lying down)
    tip: -BOTTOM + 0.48,
    rim: Math.max(...samples.map((p) => p.x)),
    blur(b: number) {
      blur.value = d.blur ? b : 0
      slotsBlur(d.blur ? b : 0)
    },
    // (a lamp spinning fast traces its ring without fading: a dot's light spreads over the whole turn, but a real
    // lamp is so bright that the ring stays dazzling)
    glow(l: number) {
      skin.emissiveIntensity = l * 2.2 * (1 + 7 * blur.value)
    },
  }
}
