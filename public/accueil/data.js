// The content: the projects of the live site (garancewetz.dev), copied from portfolio/src/content/content.ts on main
// (24/11/2026), in the same order and in French, like the site. Screenshots come from the repository (and from
// the live site for Handiplan, and the game's title screen for Paris Forest). Plus the yeti's poses, and el(), a small helper.
const SHOTS = '/shots/'

const PROJECTS = [
  { id: 'synapso', title: 'Synapso', kind: 'Application mobile (PWA)', stack: 'Next.js · TypeScript · Prisma',
    short: 'Une application de rééducation post-AVC, ou de rééducation tout court, pensée d’abord pour être simple d’utilisation.',
    alt: 'Synapso, la zone « Haut du corps » : les onglets des zones du corps, le bouton vert « Lancer la séance » et les exercices à faire.',
    demo: 'https://synapso.garancewetz.dev/', code: 'https://github.com/garancewetz/synapso-app-reeducation' },
  { id: 'signe', title: 'Signe astronomique', kind: 'Application web 3D', stack: 'TypeScript · React · Cesium · SGP4',
    short: 'Une application qui permet de visualiser l’aspect du ciel à la naissance, et donne le réel signe astrologique.',
    alt: 'Interface de Signe astronomique : un formulaire de date de naissance à gauche, la Terre en 3D sur fond étoilé à droite.',
    // on the project page, next to the screenshot: the result on a phone (made on the live site)
    phone: { src: SHOTS + 'signe-signe.webp', alt: 'Sur téléphone, le résultat : le vrai signe est Poissons, alors que l’horoscope dit Bélier, avec un schéma Terre, Soleil, constellation.' },
    demo: 'https://signe-astronomique.garancewetz.dev/', code: 'https://github.com/garancewetz/signe-astronomique' },
  { id: 'handiplan', title: 'Handiplan', kind: 'Application web (carte)', stack: 'TypeScript · React · Leaflet · Tailwind',
    short: 'Une carte : cafés et restaurants faciles d’accès, places handicapées.',
    alt: 'Handiplan sur ordinateur : la légende et la liste des lieux les plus faciles d’accès à gauche, la carte autour de l’Hôtel de Ville de Paris à droite.',
    src: SHOTS + 'handiplan-bureau.webp',
    // next to it: on a phone, a parking space's sheet and « Me garer ici » (live site, demo data)
    phone: { src: SHOTS + 'handiplan-telephone.webp', alt: 'Sur téléphone, la fiche d’une place handicapée à 178 mètres de l’arrivée, rue des Rosiers, au-dessus de la carte du Marais, avec les boutons Fermer et « Me garer ici ».' },
    demo: 'https://handiplan.garancewetz.dev/', code: 'https://github.com/garancewetz/handiplan-app' },
  { id: 'mosaique', title: 'Mosaïque', kind: 'Extension Chrome', stack: 'React · TypeScript · API Chrome',
    short: 'Une extension qui permet d’avoir un accès simplifié et facile d’utilisation aux favoris.',
    alt: 'Interface de Mosaïque sur fond sombre : les onglets ouverts à gauche, une recherche, des favoris en tuiles et des groupes colorés.',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension' },
  { id: 'trame', title: 'Trans-trame', kind: 'Visualisation de données', stack: 'React · TypeScript · Supabase',
    short: 'Une data visualisation des textes intersectionnels, pour rendre visibles les évolutions et les influences.',
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, et une frise chronologique en bas.',
    demo: null, code: 'https://github.com/garancewetz/Trans-trame' },
  // not yet on the live portfolio: its repository (garancewetz/paris-forest) is private; the screenshot is the game's
  // title screen, in October at 5 pm
  { id: 'paris-forest', title: 'Paris Forest', kind: 'Jeu 3D, dans le navigateur', stack: 'TypeScript · Three.js · Vite',
    short: 'Les 192 916 arbres de Paris, sortis des rues et replantés en une forêt à la silhouette de la ville : on s’y promène, et on y cherche toutes les espèces.',
    alt: 'Paris Forest : l’écran d’accueil « La forêt de Paris » sur une forêt de platanes en automne, l’écureuil Noisette en bas à gauche.',
    src: SHOTS + 'paris-forest.jpg', demo: null, code: null },
].map((p) => ({ ...p, src: p.src || SHOTS + p.id + '.webp' }))

// the armless yeti (features/yeti/art.ts) and its five poses: 0 crouching, 1 taking off, 2 arms up, 3 arms flat,
// 4 standing
const EARS = '(\\.:::./)', FLAP_UP = '\\\\.:::.//', FLAP_FLAT = '--.:::.--', EARS_DOWN = ' _.:::._'
const HEAD = ' :(o.o):', HAPPY = ' :(^.^):', BELLY = ' :(   ):', BELLY_LOW = ' :(___):'
const FEET = "  '' ''", STEP = "  /' '\\", LEGS = '  /   \\'
const YETI = [
  ['', '', '', '', EARS_DOWN, HEAD, BELLY_LOW],
  ['', '', EARS, HEAD, BELLY, STEP, ''],
  [FLAP_UP, HAPPY, BELLY, LEGS, '', '', ''],
  ['', FLAP_FLAT, HAPPY, BELLY, LEGS, '', ''],
  ['', '', '', EARS, HEAD, BELLY, FEET],
].map((f) => f.map((l) => l.padEnd(9)).join('\n'))

// an element from its HTML
const el = (html) => {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild
}
