// The content: the projects, in French like the site, with their screenshots (public/shots/: from the live sites, and
// the game's title screen for Paris Forest); and the yeti's poses.

export const SHOTS = '/shots/'

export type Project = {
  id: string
  title: string
  kind: string
  short: string
  src: string
  demo: string | null
  code: string | null
}

const LIST: (Omit<Project, 'src'> & { src?: string })[] = [
  { id: 'synapso', title: 'Synapso', kind: 'Application mobile (PWA)',
    short: 'Une application de rééducation post-AVC, ou de rééducation tout court, pensée d’abord pour être simple d’utilisation.',
    demo: 'https://synapso.garancewetz.dev/', code: 'https://github.com/garancewetz/synapso-app-reeducation' },
  { id: 'signe', title: 'Signe astronomique', kind: 'Application web 3D',
    short: 'Une application qui permet de visualiser l’aspect du ciel à la naissance, et donne le réel signe astrologique.',
    demo: 'https://signe-astronomique.garancewetz.dev/', code: 'https://github.com/garancewetz/signe-astronomique' },
  { id: 'handiplan', title: 'Handiplan', kind: 'Application web (carte)',
    short: 'Une carte : cafés et restaurants faciles d’accès, places handicapées.',
    src: SHOTS + 'handiplan-bureau.webp',
    demo: 'https://handiplan.garancewetz.dev/', code: 'https://github.com/garancewetz/handiplan-app' },
  { id: 'mosaique', title: 'Mosaïque', kind: 'Extension Chrome',
    short: 'Une extension qui permet d’avoir un accès simplifié et facile d’utilisation aux favoris.',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension' },
  { id: 'trame', title: 'Trans-trame', kind: 'Visualisation de données',
    short: 'Une data visualisation des textes intersectionnels, pour rendre visibles les évolutions et les influences.',
    demo: null, code: 'https://github.com/garancewetz/Trans-trame' },
  // not yet on the live portfolio: its repository (garancewetz/paris-forest) is private; the screenshot is the game's
  // title screen, in October at 5 pm
  { id: 'paris-forest', title: 'Paris Forest', kind: 'Jeu 3D, dans le navigateur',
    short: 'Les 192 916 arbres de Paris, sortis des rues et replantés en une forêt à la silhouette de la ville : on s’y promène, et on y cherche toutes les espèces.',
    src: SHOTS + 'paris-forest.jpg', demo: null, code: null },
]
export const PROJECTS: Project[] = LIST.map((p) => ({ ...p, src: p.src || SHOTS + p.id + '.webp' }))

// the armless yeti, drawn in characters, and its five poses: 0 crouching, 1 taking off, 2 arms up, 3 arms flat,
// 4 standing
const EARS = '(\\.:::./)', FLAP_UP = '\\\\.:::.//', FLAP_FLAT = '--.:::.--', EARS_DOWN = ' _.:::._'
const HEAD = ' :(o.o):', HAPPY = ' :(^.^):', BELLY = ' :(   ):', BELLY_LOW = ' :(___):'
const FEET = "  '' ''", STEP = "  /' '\\", LEGS = '  /   \\'
export const YETI = [
  ['', '', '', '', EARS_DOWN, HEAD, BELLY_LOW],
  ['', '', EARS, HEAD, BELLY, STEP, ''],
  [FLAP_UP, HAPPY, BELLY, LEGS, '', '', ''],
  ['', FLAP_FLAT, HAPPY, BELLY, LEGS, '', ''],
  ['', '', '', EARS, HEAD, BELLY, FEET],
].map((f) => f.map((l) => l.padEnd(9)).join('\n'))
