import * as THREE from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { VARIANTS } from './motifs'
import { FLOOR, type Spinner } from './spin'

// The pencil line: the tip of a spinning top leaves a line on the page, in the colour of its tip (the plastic of
// its foot), like a coloured lead. It slides: a line; it wobbles: small loops; it falls: the line breaks off. The
// page keeps the trace of the game until you leave it. The line is thin, like a lead (a line as wide as the tip
// made a ribbon, not a pencil line).

// per top, the number of lines kept (beyond that, the oldest fade); and the pencil's step
const MAX = 12000
const STEP = 0.025
// (in screen pixels)
const WIDTH = 1.2

export function traces(scene: THREE.Scene, tops: Spinner[]) {
  const pens = tops.map((t) => {
    // (independent segments, two points each: a line can break off)
    const positions = new Float32Array(MAX * 6)
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(positions)
    geometry.instanceCount = 0
    const ink = new LineMaterial({ color: VARIANTS[t.variant].plastic, linewidth: WIDTH })
    const lines = new LineSegments2(geometry, ink)
    // (always drawn: its points move, the box around it would not follow)
    lines.frustumCulled = false
    scene.add(lines)
    // (the line's points, as the graphics card reads them)
    const buffer = (geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data
    return { t, positions, geometry, buffer, count: 0, last: null as THREE.Vector3 | null }
  })
  const p = new THREE.Vector3()

  return {
    step() {
      for (const pen of pens) {
        const { t } = pen
        t.point(p)
        // (the pencil touches the page: the tip rests on it, and the top spins on it)
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
          // (full: forget the oldest half)
          pen.positions.copyWithin(0, (MAX / 2) * 6)
          pen.count = MAX / 2
        }
        // (laid just above the page, so as not to blend into it)
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
