import { MOOD, addFace } from './face'
import { ARM_DOWN, VIOLET, breathe, hold, pulse, sway, type Look } from './looks-shared'
import { frontZ, material, mesh, onSurface, sign, sphere } from './parts'
import { backpack, bubble, cloud, glasses, greenLight, plaster, straps } from './props'
import { BODY, pousse } from './pousse'

// Pousse the rest of the time: calm (at rest, asleep, offline), your move (approval), something wrong (red CI, a
// heavy session), someone asking (a review, feedback on the PR).

// at rest: mint, still on its feet, arm down, breathing, the sprout in a breeze, a glance aside now and then
export function rest(): Look {
  const pose = pousse()
  const face = addFace(pose)
  return {
    root: pose.root,
    update: (t, open) => {
      breathe(pose, t, 1.6, 0.018)
      pose.arm.rotation.z = ARM_DOWN + Math.sin(t * 0.8) * 0.06
      pose.sprout.rotation.z = Math.sin(t * 1.3) * 0.12
      const glance = Math.max(0, Math.sin(t * 0.4) - 0.85) * 0.25
      face.set({ open, dx: glance })
    },
  }
}

// a Claude session is done, its turn handed back to you: mint, happy, it waves at you, hello, your turn
export function turnDone(): Look {
  const pose = pousse()
  const face = addFace(pose)
  return {
    root: pose.root,
    update: (t, open) => {
      sway(pose, t)
      breathe(pose, t, 1.6, 0.018)
      pose.arm.rotation.z = 0.1 + Math.sin(t * 6) * 0.3
      face.set({ ...MOOD.good, open })
    },
  }
}

// do-not-disturb: asleep, eyes shut, the sprout drooping, a slow deep breath, small « z » rising
export function asleep(): Look {
  const pose = pousse()
  const face = addFace(pose)
  const zs = [0, 1, 2].map(() => {
    const sprite = sign('z', '#17524c', 0.3)
    pose.root.add(sprite)
    return sprite
  })
  return {
    root: pose.root,
    float: 0.25,
    update: (t) => {
      breathe(pose, t, 1.1, 0.035)
      pose.sprout.rotation.z = 0.55 + Math.sin(t * 1.1) * 0.06
      pose.arm.rotation.z = ARM_DOWN
      pose.root.rotation.z = 0.07
      zs.forEach((sprite, index) => {
        const rise = (t * 0.28 + index / 3) % 1
        sprite.position.set(0.3 + rise * 0.55 + Math.sin(t * 1.5 + index) * 0.04, 1.1 + rise * 0.45, 0.2)
        sprite.scale.setScalar(0.26 + rise * 0.22)
        sprite.material.opacity = Math.min(1, Math.sin(rise * Math.PI) * 1.8)
      })
      face.set({ eyes: 'closed', mouth: 'o', say: 0.45 + Math.sin(t * 1.1) * 0.15 })
    },
  }
}

// Kit's server no longer answers: greyed out, dozing under a small grey cloud; its eyes close slowly, its head drops,
// then it starts and opens them halfway, again and again
export function offline(): Look {
  const pose = pousse({ faded: true })
  const face = addFace(pose)
  const shade = hold(pose.root, cloud(), [0.05, 1.4, -0.15])
  return {
    root: pose.root,
    float: 0.3,
    update: (t) => {
      const phase = (t % 4.5) / 4.5
      const nod = phase < 0.85 ? phase / 0.85 : 1 - (phase - 0.85) / 0.15
      pose.sprout.rotation.z = 0.35 + Math.sin(t * 0.9) * 0.05
      pose.arm.rotation.z = ARM_DOWN
      pose.root.rotation.x = nod * nod * 0.2
      shade.position.x = 0.05 + Math.sin(t * 0.5) * 0.1
      shade.position.y = 1.4 + Math.sin(t * 1.1) * 0.03
      face.set({ open: 0.5 - nod * 0.43, dy: -0.02, mouth: 'flat' })
    },
  }
}

// Claude waits for your go: it raises its hand high, a little green light in it, and waves it, gently but on and
// on, on its toes, eyes up at you, calling
export function approval(): Look {
  const pose = pousse()
  const face = addFace(pose)
  const { prop, lamp, light } = greenLight()
  const carrier = hold(pose.arm, prop, [0.3, 0.5, 0.12], [0, 0, 0], 1.5)
  return {
    root: pose.root,
    update: (t, open) => {
      sway(pose, t)
      pose.arm.rotation.z = 0.4 + Math.sin(t * 4.5) * 0.22
      // the light stays upright in the waving hand
      carrier.rotation.z = -pose.arm.rotation.z
      const beat = pulse(t, 4.5)
      lamp.emissiveIntensity = 1.1 + beat * 0.9
      light.scale.setScalar(0.6 + beat * 0.25)
      pose.root.position.y = pulse(t, 9) * 0.04
      face.set({ ...MOOD.yourMove, open, dy: 0.035, say: 0.7 + beat * 0.5 })
    },
  }
}

// red CI: a red plaster on its head, worried, a wavy mouth, a drop of sweat running down; it wrings its hand
export function checksRed(): Look {
  const pose = pousse()
  const face = addFace(pose)
  const patch = onSurface(plaster(), BODY, 0.36, 0.5, 0.035)
  patch.scale.setScalar(1.35)
  pose.root.add(patch)
  const drop = mesh(sphere, material(0x9fd8ff, { transparent: true, opacity: 0.85, roughness: 0.05, clearcoat: 1 }), { scale: [0.045, 0.07, 0.035] })
  pose.root.add(drop)
  return {
    root: pose.root,
    update: (t, open) => {
      pose.sprout.rotation.z = Math.sin(t * 1.6) * 0.1 + 0.15
      pose.arm.rotation.z = -1.1 + Math.sin(t * 7) * 0.12
      pose.root.rotation.z = Math.sin(t * 1.9) * 0.03
      const run = (t * 0.45) % 1
      const y = 0.5 - run * 0.45
      drop.position.set(-0.66, y, frontZ(BODY, -0.66, y) + 0.02)
      drop.visible = run < 0.9
      face.set({ ...MOOD.wrong, open, dx: Math.sin(t * 1.3) * 0.03, dy: -0.025 })
    },
  }
}

// a heavy session: it carries a backpack far too big, bent under it, swaying a little, worried, eyes tired
export function heavySession(): Look {
  const pose = pousse()
  const face = addFace(pose)
  const { prop, trim } = backpack()
  hold(pose.root, prop, [0, 0.2, -1.25])
  pose.root.add(straps(trim, (x, y) => frontZ(BODY, x, y)))
  return {
    root: pose.root,
    float: 0.15,
    update: (t, open) => {
      pose.sprout.rotation.z = Math.sin(t * 1.4) * 0.12
      pose.arm.rotation.z = -1.3 + Math.sin(t * 1.2) * 0.05
      pose.root.rotation.x = 0.17 + Math.sin(t * 1.2) * 0.025
      pose.root.rotation.z = Math.sin(t * 0.9) * 0.05
      pose.root.position.y = -Math.abs(Math.sin(t * 0.9)) * 0.03
      face.set({ ...MOOD.wrong, open: open * 0.7, dy: -0.02 })
    },
  }
}

// a review asked of you: violet, reading glasses on; its eyes run along the lines, line after line, its head bowed
// a little, and now and then the glasses slip and it sets them back
export function reviewAsked(): Look {
  const pose = pousse({ skin: VIOLET })
  const face = addFace(pose)
  const specs = glasses(0.3, 0.13, 0.9)
  pose.root.add(specs)
  return {
    root: pose.root,
    update: (t, open) => {
      sway(pose, t)
      pose.arm.rotation.z = ARM_DOWN + Math.sin(t * 0.8) * 0.05
      const line = (t / 1.4) % 3
      const along = line % 1
      pose.root.rotation.x = 0.06 + Math.floor(line) * 0.02
      specs.position.y = along > 0.85 && Math.floor(line) === 2 ? 0.03 : -Math.floor(line) * 0.012
      face.set({ ...MOOD.asking, open, dx: -0.04 + along * 0.08, dy: -0.01 - Math.floor(line) * 0.012 })
    },
  }
}

// feedback on your PR: violet, a speech bubble beside it where someone is writing; it looks up at it, and waves
export function prFeedback(): Look {
  const pose = pousse({ skin: VIOLET })
  const face = addFace(pose)
  const { prop, dots } = bubble(VIOLET)
  const carrier = hold(pose.root, prop, [-0.7, 1.2, 0.3], [0, 0.2, 0])
  return {
    root: pose.root,
    update: (t, open) => {
      sway(pose, t)
      pose.arm.rotation.z = Math.sin(t * 3) * 0.25
      carrier.position.y = 1.2 + Math.sin(t * 2) * 0.03
      dots.forEach((dot, index) => (dot.position.y = pulse(t * 6 - index * 0.9, 1) * 0.05))
      face.set({ ...MOOD.asking, open, dx: -0.03, dy: 0.035 })
    },
  }
}

// feedback addressed: the fixes pushed, only the reviewer's move left; the feedback's violet and its bubble, but done:
// a green tick in it, Pousse pleased with itself
export function prAddressed(): Look {
  const pose = pousse({ skin: VIOLET })
  const face = addFace(pose)
  const { prop, dots } = bubble(VIOLET)
  dots.forEach((dot) => (dot.visible = false))
  const tick = sign('✓', '#2f9e6e', 0.34)
  tick.position.set(0, 0.01, 0.12)
  prop.add(tick)
  const carrier = hold(pose.root, prop, [-0.7, 1.2, 0.3], [0, 0.2, 0])
  return {
    root: pose.root,
    update: (t, open) => {
      sway(pose, t)
      breathe(pose, t, 1.6, 0.018)
      pose.arm.rotation.z = 0.15 + Math.sin(t * 2.2) * 0.12
      carrier.position.y = 1.2 + Math.sin(t * 1.6) * 0.03
      tick.scale.setScalar(0.34 * (1 + pulse(t, 1.6) * 0.08))
      face.set({ ...MOOD.good, open })
    },
  }
}
