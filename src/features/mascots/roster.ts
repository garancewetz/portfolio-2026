import * as THREE from 'three'
import { asciiYeti } from './ascii-yeti'
import { eggYeti } from './cast'
import { goblin, mouse, robot } from './critters'
import { otter, owl, sloth } from './critters-2'
import { yetiFlier } from './ears'
import type { Flier } from './parts'

// The mascots, in their order on the page: how to build each one standing (in its place) and flying (in the sky),
// and its own colour, a frank one (null: as it is made, the yeti white as snow). The key names it in the browser's
// memory (roam.ts) and, for the Créatures ones, finds its ASCII and its word in the bestiary.

export type Member = {
  key: string
  own: string | null
  build: () => { object: THREE.Group; update: (t: number) => void }
  flier: () => Flier
}

export const ROSTER: Member[] = [
  { key: 'Yétou', own: null, build: asciiYeti, flier: () => yetiFlier(asciiYeti()) },
  { key: 'Yéta', own: '#6f9bff', build: eggYeti, flier: () => yetiFlier(eggYeti()) },
  { key: 'robot', own: null, build: robot, flier: robot },
  { key: 'souris', own: '#ffc21a', build: mouse, flier: mouse },
  { key: 'gobelin', own: '#12d89c', build: goblin, flier: goblin },
  { key: 'hibou', own: '#8f5bff', build: owl, flier: owl },
  { key: 'loutre', own: '#ff8a3d', build: otter, flier: otter },
  { key: 'paresseux', own: '#ff4fa3', build: sloth, flier: sloth },
]
