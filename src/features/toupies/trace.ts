import * as THREE from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { VARIANTS } from './motifs'
import { FLOOR, type Spinner } from './spin'

// Le trait de crayon : la pointe d'une toupie qui tourne laisse sur la page un trait, de la couleur de sa pointe (le
// plastique de son pied), comme une mine de couleur. Elle glisse : une ligne ; elle vacille : de petites boucles ;
// elle tombe : le trait s'interrompt. La page garde la trace du jeu jusqu'à ce qu'on la quitte. Le trait est fin,
// comme une mine (un trait aussi large que la pointe faisait un ruban, pas un trait de crayon).

// par toupie, le nombre de traits gardés (au-delà, les plus anciens s'effacent) ; et le pas du crayon
const MAX = 12000
const STEP = 0.025
// (en pixels à l'écran)
const WIDTH = 1.2

export function traces(scene: THREE.Scene, tops: Spinner[]) {
  const pens = tops.map((t) => {
    // (des segments indépendants, deux points chacun : un trait peut s'interrompre)
    const positions = new Float32Array(MAX * 6)
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(positions)
    geometry.instanceCount = 0
    const ink = new LineMaterial({ color: VARIANTS[t.variant].plastic, linewidth: WIDTH })
    const lines = new LineSegments2(geometry, ink)
    // (toujours dessiné : ses points bougent, la boîte qui l'englobe ne suivrait pas)
    lines.frustumCulled = false
    scene.add(lines)
    // (les points du trait, tels que la carte graphique les lit)
    const buffer = (geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data
    return { t, positions, geometry, buffer, count: 0, last: null as THREE.Vector3 | null }
  })
  const p = new THREE.Vector3()

  return {
    step() {
      for (const pen of pens) {
        const { t } = pen
        t.point(p)
        // (le crayon touche la page : la pointe y est posée, et la toupie tourne sur elle)
        const down = p.y < FLOOR + 0.02 && t.omega > 1.2 && t.fall < 0.2
        if (!down) {
          pen.last = null
          continue
        }
        if (!pen.last) {
          pen.last = p.clone()
          continue
        }
        if (p.distanceTo(pen.last) < STEP) continue
        if (pen.count === MAX) {
          // (plein : on oublie la plus ancienne moitié)
          pen.positions.copyWithin(0, (MAX / 2) * 6)
          pen.count = MAX / 2
        }
        // (posé à peine au-dessus de la page, pour ne pas s'y mêler)
        const y = FLOOR + 0.003
        pen.positions.set([pen.last.x, y, pen.last.z, p.x, y, p.z], pen.count * 6)
        pen.count++
        pen.last.copy(p)
        pen.geometry.instanceCount = pen.count
        pen.buffer.needsUpdate = true
      }
    },
  }
}
