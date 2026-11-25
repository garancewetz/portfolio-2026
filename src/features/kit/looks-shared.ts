import * as THREE from 'three'
import type { Vec3 } from './parts'
import type { Pose } from './pousse'

// What every look shares: its shape for the stage, the outfit colours, and the small gestures they reuse.

// update gets the time in seconds and how open the eyes are in the current blink; float is how much the stage lets
// it float (1 by default, less when asleep or weighed down)
export type Look = {
  root: THREE.Group
  float?: number
  update: (t: number, open: number) => void
}

export const BLUE = 0x5aaef0
export const CORAL = 0xff7f66
export const AMBER = 0xffaa2e
export const VIOLET = 0x9283f0

export const pulse = (t: number, speed: number) => Math.max(0, Math.sin(t * speed))
// the raised arm, put down at its side
export const ARM_DOWN = -1.8

// a prop placed on Pousse, or on its arm to move with it
export function hold(parent: THREE.Object3D, prop: THREE.Object3D, position: Vec3, rotation: Vec3 = [0, 0, 0], scale = 1) {
  const carrier = new THREE.Group()
  carrier.position.set(...position)
  carrier.rotation.set(...rotation)
  carrier.scale.setScalar(scale)
  carrier.add(prop)
  parent.add(carrier)
  return carrier
}

// a slow breath: it swells a hair and settles, it never grows
export function breathe(pose: Pose, t: number, speed: number, amount: number) {
  const s = Math.sin(t * speed) * amount
  pose.root.scale.set(1 + s * 0.5, 1 + s, 1 + s * 0.5)
}

export const sway = (pose: Pose, t: number) => (pose.sprout.rotation.z = Math.sin(t * 2.6) * 0.2)
