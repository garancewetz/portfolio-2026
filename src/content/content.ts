// All the site's content: texts, projects, background, links (the rest of the code holds no text to change).
import type { Carnet, Person, Project } from './types'

export const me: Person = {
  name: 'Garance Wetzel',
  github: 'https://github.com/garancewetz',
  linkedin: 'https://www.linkedin.com/in/garancewetzel/',
}

// The projects (one card each). demo: link to the site if it is online; otherwise the card leads to code.
// wip: in progress, online soon. short: the sentence that says what it is, written by Garance (in the sheet).
// tags: a few words about the project's subject (not the tech), under the card title. kind, stack: the
// details, shown in the project sheet (click on a card).
// The order: for the rhythm of the two-tone grid, a light screenshot, then a dark one (Synapso, Signe, Handiplan,
// Mosaïque); the one not online yet comes last. (The CV as a game, wwwetzel journey, is no longer here: it is
// about Garance, the site shows her projects; it stays online, under /journey, see netlify.toml.)
// image: 16/10 screenshot in public/shots (WebP, 1200 px wide). phone: in the sheet, a phone screen
// beside it (see types.ts).
export const projects: Project[] = [
  {
    id: 'synapso',
    title: 'Synapso',
    short:
      'Une application de rééducation post-AVC, ou de rééducation tout court, pensée d’abord pour être simple d’utilisation.',
    tags: ['rééducation', 'AVC', 'santé'],
    kind: 'Application mobile (PWA)',
    stack: ['Next.js', 'TypeScript', 'Prisma'],
    image: '/shots/synapso.webp', // screenshot of the « Haut du corps » area of the live site (800 × 500, taken in Claude's browser; the home is already in the phone screen)
    alt: 'Synapso, la zone « Haut du corps » : les onglets des zones du corps (Visage, Haut, Tronc, Jambes, Étirer), le bouton vert « Lancer la séance » (5 exercices, environ 7 min) et les huit exercices à faire, comme « Serrer une balle », « Cercles du poignet » ou « Bras avec poids ».',
    // in the sheet, beside the screenshot: the home on a phone (made locally, with the demo account and data)
    phone: {
      src: '/shots/synapso-home.webp',
      alt: 'Sur téléphone, l’accueil : « Bonjour, Calypso », 7 jours actifs sur 7, le bouton « Commencer ma séance » et les zones du corps.',
    },
    demo: 'https://synapso.garancewetz.dev/',
    code: 'https://github.com/garancewetz/synapso-app-reeducation',
  },
  {
    id: 'signe',
    title: 'Signe astronomique',
    short:
      'Une application qui permet de visualiser l’aspect du ciel à la naissance, et donne le réel signe astrologique.',
    tags: ['astronomie', 'ciel', 'naissance'],
    kind: 'Application web 3D',
    stack: ['TypeScript', 'React', 'Cesium', 'SGP4'],
    image: '/shots/signe.webp',
    alt: 'Interface de Signe astronomique : un formulaire de date de naissance à gauche, la Terre en 3D sur fond étoilé à droite.',
    // in the sheet, beside the screenshot: the result on a phone (made on the live site)
    phone: {
      src: '/shots/signe-signe.webp',
      alt: 'Sur téléphone, le résultat : le vrai signe est Poissons, alors que l’horoscope dit Bélier, avec un schéma Terre, Soleil, constellation.',
    },
    demo: 'https://signe-astronomique.garancewetz.dev/',
    code: 'https://github.com/garancewetz/signe-astronomique',
  },
  {
    id: 'handiplan',
    title: 'Handiplan',
    short: 'Une carte : cafés et restaurants faciles d’accès, places handicapées.',
    tags: ['handicap', 'accessibilité', 'stationnement'],
    kind: 'Application web (carte)',
    stack: ['TypeScript', 'React', 'Leaflet', 'Tailwind'],
    image: '/shots/handiplan-bureau.webp', // the live site on a computer (1280 × 800, demo data: ?demo, the centre of Paris)
    alt: 'Handiplan sur ordinateur : à gauche, la légende (Facile, Attention, Difficile, Pas d’info, Place handicapée) et la liste « Les plus faciles d’abord », des toilettes publiques, Pastasuta et McDonald’s, faciles avec toilettes adaptées, une place handicapée, puis les filtres et « Où allez-vous ? » ; à droite, la carte autour de l’Hôtel de Ville de Paris, avec des cafés et restaurants verts ou orange et des places handicapées en bleu.',
    // in the sheet, beside the screenshot: on a phone, a parking spot's sheet and « Me garer ici », which opens Waze
    // or Google Maps (live site, demo data)
    phone: {
      src: '/shots/handiplan-telephone.webp',
      alt: 'Sur téléphone, la fiche d’une place handicapée à 178 mètres de l’arrivée, rue des Rosiers, au-dessus de la carte du Marais, avec les boutons Fermer et « Me garer ici ».',
    },
    demo: 'https://handiplan.garancewetz.dev/',
    code: 'https://github.com/garancewetz/handiplan-app',
  },
  {
    id: 'mosaique',
    title: 'Mosaïque',
    short: 'Une extension qui permet d’avoir un accès simplifié et facile d’utilisation aux favoris.',
    tags: ['favoris', 'simplicité', 'autonomie'],
    kind: 'Extension Chrome',
    stack: ['React', 'TypeScript', 'API Chrome'],
    image: '/shots/mosaique.webp', // screenshot of the Chrome Web Store listing
    alt: 'Interface de Mosaïque sur fond sombre : les onglets ouverts à gauche, une recherche, des favoris en tuiles (Gmail, SNCF, Météo, Doctolib…) et des groupes colorés comme « Démarches » et « Actualité ».',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension',
  },
  {
    id: 'trame',
    wip: true,
    title: 'Trans-trame',
    short: 'Une data visualisation des textes intersectionnels, pour rendre visibles les évolutions et les influences.',
    tags: ['intersectionnalité', 'livres', 'transmission'],
    kind: 'Visualisation de données',
    stack: ['React', 'TypeScript', 'Supabase'],
    image: '/shots/trame.webp', // screenshot made with demo data
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, avec des titres comme Le Deuxième Sexe, Gender Trouble ou Sister Outsider, et une frise chronologique en bas.',
    demo: null,
    code: 'https://github.com/garancewetz/Trans-trame',
  },
]

// The lab (the notebook of experiments): on the home, the « labo → » badge (/?labo, see src/home/lab.ts); then
// you turn its pages (see features/carnet). Each page: its name, its address, its screenshot
// (16/10, WebP, 1200 px wide) and its description.
export const carnet: Carnet = {
  href: '/?labo',
  pages: [
    {
      name: 'toupies',
      href: '/toupies/',
      src: '/shots/toupies.webp',
      alt: 'Des toupies à pompe en tôle posées sur une page claire ; les deux de devant tournent : l’une, à quartiers de couleurs, fondue en pastels mêlés, l’autre, à rayures noires et blanches, devenue grise ; sous elles, sur la page, le trait fin de leur pointe, bleu et rouge ; au fond, les autres attendent, couchées.',
    },
    {
      name: 'murmuration',
      href: '/murmuration/',
      src: '/shots/murmuration.webp',
      alt: 'Sur un ciel de crépuscule indigo, un grand nuage d’oiseaux dessiné en caractères aux couleurs d’un coucher de soleil, rose fluo en haut, orange en bas (des points, des v, des W plus denses là où ils se croisent) au-dessus d’un village perché, son clocher et ses maisons en escalier, en bas à droite.',
    },
    {
      name: 'créatures',
      href: '/creatures/',
      src: '/shots/creatures.webp',
      alt: 'Sur une page blanche, des créatures dessinées en caractères dorment chacune sur son bout de ficelle, les yeux fermés, un petit z près de la tête ; deux sont réveillées, un hibou et un yéti : ils sautent sur leur ficelle et laissent derrière eux un trait de leur couleur, vert et rouge, qui garde la forme de leurs sauts.',
    },
    {
      name: 'kit',
      href: '/kit/',
      src: '/shots/kit.webp',
      alt: 'Sur une page gris pâle, six cartes blanches, une par étape d’un ticket, et sur chacune Pousse, une petite mascotte ronde et vernie avec une pousse sur la tête : bleue avec un ticket doré, menthe, corail avec une caméra, orange avec une caisse à outils, violette avec un avion en papier, et menthe encore, sa pousse en fleur.',
    },
    {
      name: 'mascottes',
      href: '/mascottes/',
      src: '/shots/mascottes.webp',
      alt: 'Sur une mer de nuages bleue, huit créatures de la page Créatures en 3D, en rang, chacune sous l’ASCII dont elle vient et dans sa couleur : deux yétis sans bras aux grandes oreilles, Yétou blanc et Yéta bleue, puis un robot sur ressorts, une souris jaune, un gobelin menthe aux grandes oreilles, un hibou violet, une loutre orange et un paresseux rose.',
    },
    {
      name: 'ruban',
      href: '/ruban/',
      src: '/shots/ruban.webp',
      alt: 'Sur un fond noir, un ruban de lumière, coupé par deux silences, ondule de gauche à droite en changeant de couleur avec la note ; un petit yéti en caractères, aux grandes oreilles, grimpe dessus ; sur le bord gauche, la gamme, chaque note à sa hauteur et de sa couleur.',
    },
    {
      name: 'abyme',
      href: '/abyme/',
      src: '/shots/abyme.webp',
      alt: 'Une fenêtre de navigateur ouverte sur la page Toupies ; dedans, une fenêtre plus petite sur la page Fourrure, toute noire, puis une sur Murmuration, et tout au fond, l’accueil du site.',
    },
  ],
}
