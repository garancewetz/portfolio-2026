import * as THREE from 'three'
import { MOOD, addFace } from './face'
import { AMBER, BLUE, CORAL, VIOLET, hold, pulse, sway, type Look } from './looks-shared'
import { material, mesh, sign, sphere } from './parts'
import { camera, magnifier, notepad, plane, ticket } from './props'
import { pousse } from './pousse'

// The six steps of a ticket, in order: the plan, the work, the video, the audit, the PR, shipped. All good news
// (look when you like), except the work, where it thinks hard.

// the plan is ready: blue, proud, it waves its ticket
export function planReady(): Look {
  const pose = pousse({ skin: BLUE })
  const face = addFace(pose)
  const carrier = hold(pose.root, ticket(), [1.05, 0.5, 0.5], [0, -0.3, -0.12], 1.05)
  return {
    root: pose.root,
    update: (t) => {
      sway(pose, t)
      pose.arm.rotation.z = 0.2 + Math.sin(t * 2) * 0.05
      carrier.rotation.z = -0.12 + Math.sin(t * 4.5) * 0.18
      face.set(MOOD.good)
    },
  }
}

// while Claude works: eyes narrowed, a hand tapping its temple, the mouth pursed, the tip of the tongue out, a
// notepad in front of it, sums and a doubt rising from its head
export function think(): Look {
  const pose = pousse()
  const face = addFace(pose)
  // the raised arm goes to its temple
  pose.arm.visible = false
  const temple = mesh(new THREE.CapsuleGeometry(0.13, 0.3, 8, 16), pose.body, { position: [0.86, 0.2, 0.42], rotation: [0.3, 0, 0.55] })
  pose.root.add(temple)
  hold(pose.root, notepad(), [0.55, -0.42, 0.85], [-0.55, -0.25, 0.08])
  // the pursed mouth, pushed to one side, in place of the smile
  const mouth = new THREE.Group()
  mouth.position.set(0.07, -0.13, pose.mouthZ)
  mouth.rotation.z = 0.25
  mouth.add(mesh(sphere, material(0x2b2b33), { scale: [0.075, 0.03, 0.02] }))
  const tongue = mesh(sphere, material(0xff7f8f), { position: [0.07, -0.025, 0.005], scale: [0.04, 0.032, 0.02] })
  mouth.add(tongue)
  pose.root.add(mouth)
  const columns = [-0.85, -0.45, 0.3, 0.62, -0.1]
  const sums = ['+', '×', '=', '÷', '?'].map((text) => {
    const sprite = sign(text, '#17524c')
    pose.root.add(sprite)
    return sprite
  })
  return {
    root: pose.root,
    update: (t, open) => {
      pose.sprout.rotation.y = t * 2.5
      sway(pose, t)
      temple.position.y = 0.2 + pulse(t, 5) * 0.03
      pose.root.rotation.x = -0.03
      sums.forEach((sprite, index) => {
        const rise = (t * 0.7 + index * 0.37) % 1
        sprite.position.set(columns[index] + Math.sin(t * 2 + index) * 0.05, 0.95 + rise * 0.45, 0.3)
        sprite.material.opacity = Math.min(1, Math.sin(rise * Math.PI) * 1.6)
      })
      tongue.visible = Math.sin(t * 1.4) > 0.2
      mouth.scale.x = 1 + Math.sin(t * 3) * 0.12
      // narrowed, looking up and aside: someone working something out in their head
      face.set({ open: open * 0.35, dx: 0.03, dy: 0.04, mouth: 'none' })
    },
  }
}

// the video is ready: coral, it raises the camera to its eye and shoots
export function videoReady(): Look {
  const pose = pousse({ skin: CORAL })
  const face = addFace(pose)
  const carrier = hold(pose.root, camera(), [0.78, 0.08, 0.62], [0.1, -0.35, -0.08])
  return {
    root: pose.root,
    update: (t) => {
      sway(pose, t)
      const shooting = t % 2.6 < 0.35
      pose.arm.rotation.z = 0.15
      carrier.position.y = 0.08 + (shooting ? 0.06 : 0)
      face.set(MOOD.good)
    },
  }
}

// the audit is done: amber, a magnifying glass in hand; it sweeps it slowly, then nods, nothing left to find
export function auditDone(): Look {
  const pose = pousse({ skin: AMBER })
  const face = addFace(pose)
  hold(pose.arm, magnifier(), [0.2, 0.3, 0.3], [0, -0.2, 0.35])
  return {
    root: pose.root,
    update: (t) => {
      sway(pose, t)
      const phase = t % 4.4
      pose.arm.rotation.z = phase < 3 ? 0.05 + Math.sin(phase * 2.1) * 0.25 : 0.05
      pose.root.rotation.x = phase < 3 ? 0 : Math.sin(((phase - 3) * Math.PI * 2) / 0.7) * 0.07
      face.set(MOOD.good)
    },
  }
}

// the PR is ready: violet, it throws the paper plane, follows it with its eyes, and the plane comes back to its hand
export function prReady(): Look {
  const pose = pousse({ skin: VIOLET })
  const face = addFace(pose)
  const start = [0.95, 0.72, 0.45] as const
  const carrier = hold(pose.root, plane(), [...start], [0.75, -0.55, 0.45], 1.2)
  return {
    root: pose.root,
    update: (t) => {
      sway(pose, t)
      const phase = (t % 3) / 3
      const flight = phase < 0.2 ? 0 : Math.min(1, (phase - 0.2) / 0.6)
      pose.arm.rotation.z = phase < 0.2 ? -0.4 + phase * 4 : 0.5 - flight * 0.4
      carrier.position.set(start[0] + flight * 1.1, start[1] + Math.sin(flight * Math.PI) * 0.45 + flight * 0.3, start[2] + flight * 0.4)
      carrier.scale.setScalar(1.2 * (1 - flight * 0.6))
      carrier.visible = phase < 0.85
      face.set(MOOD.good)
    },
  }
}

// merged: happy closed eyes, a jump for joy, the sprout in bloom, the flower spinning
export function shipped(): Look {
  const pose = pousse({ bloom: true })
  const face = addFace(pose)
  return {
    root: pose.root,
    update: (t) => {
      sway(pose, t)
      pose.root.position.y = pulse(t, 4.5) * 0.18
      pose.arm.rotation.z = Math.sin(t * 8) * 0.5
      pose.flower.rotation.z = t * 2.5
      face.set({ ...MOOD.good, brows: 'raised' })
    },
  }
}
