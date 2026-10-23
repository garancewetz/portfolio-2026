// Tout le contenu du site : textes, projets, parcours, liens (le reste du code ne contient pas de texte à changer).
import type { Person, Project } from './types'

export const me: Person = {
  name: 'Garance Wetzel',
  github: 'https://github.com/garancewetz',
  linkedin: 'https://www.linkedin.com/in/garancewetzel/',
}

// Parcours, du poste actuel au plus ancien (« Aujourd'hui chez …, avant … et … »)
export const experience: string[] = ['Okeiro', 'Colorz', 'Uptoo']

// Les projets (une carte chacun). demo : lien du site s'il est en ligne ; sinon la carte mène à code.
// wip : en cours, bientôt en ligne. short : la phrase qui dit ce que c'est, écrite par Garance (dans la fiche, et sur
// mobile). kind, stack : les détails, affichés dans la fiche du projet (clic sur une carte).
// image : capture 16/10 dans public/shots (WebP, 1200 px de large). phone : dans la fiche, un écran de téléphone
// à côté (voir types.ts).
export const projects: Project[] = [
  {
    id: 'signe',
    title: 'Signe astronomique',
    short:
      'Une application qui permet de visualiser l’aspect du ciel à la naissance, et donne le réel signe astrologique.',
    kind: 'Application web 3D',
    stack: ['TypeScript', 'React', 'Cesium', 'SGP4'],
    image: '/shots/signe.webp',
    alt: 'Interface de Signe astronomique : un formulaire de date de naissance à gauche, la Terre en 3D sur fond étoilé à droite.',
    // dans la fiche, à côté de la capture : le résultat sur téléphone (fait sur le site en ligne)
    phone: {
      src: '/shots/signe-signe.webp',
      alt: 'Sur téléphone, le résultat : le vrai signe est Poissons, alors que l’horoscope dit Bélier, avec un schéma Terre, Soleil, constellation.',
    },
    demo: 'https://signe-astronomique.garancewetz.dev/',
    code: 'https://github.com/garancewetz/signe-astronomique',
  },
  {
    id: 'trame',
    wip: true,
    title: 'Trans-trame',
    short: 'Une data visualisation des textes intersectionnels, pour rendre visibles les évolutions et les influences.',
    kind: 'Visualisation de données',
    stack: ['React', 'TypeScript', 'Supabase'],
    image: '/shots/trame.webp', // capture faite avec des données de démo
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, avec des titres comme Le Deuxième Sexe, Gender Trouble ou Sister Outsider, et une frise chronologique en bas.',
    demo: null,
    code: 'https://github.com/garancewetz/Trans-trame',
  },
  {
    id: 'synapso',
    title: 'Synapso',
    short:
      'Une application de rééducation post-AVC, ou de rééducation tout court, pensée d’abord pour être simple d’utilisation.',
    kind: 'Application mobile (PWA)',
    stack: ['Next.js', 'TypeScript', 'Prisma'],
    image: '/shots/synapso.webp', // capture faite avec un compte et des données de démo
    alt: 'Page « Ma progression » de Synapso : un calendrier des 28 derniers jours rempli de pastilles vertes, une série de 14 jours, les exercices par zone du corps et une liste de progrès notés.',
    // dans la fiche, à côté de la capture : l'accueil sur téléphone (fait en local, avec le compte et les données
    // de démo)
    phone: {
      src: '/shots/synapso-home.webp',
      alt: 'Sur téléphone, l’accueil : « Bonjour, Calypso », 7 jours actifs sur 7, le bouton « Commencer ma séance » et les zones du corps.',
    },
    demo: 'https://synapso.garancewetz.dev/',
    code: 'https://github.com/garancewetz/synapso-app-reeducation',
  },
  {
    id: 'mosaique',
    title: 'Mosaïque',
    short: 'Une extension qui permet d’avoir un accès simplifié et facile d’utilisation aux favoris.',
    kind: 'Extension Chrome',
    stack: ['React', 'TypeScript', 'API Chrome'],
    image: '/shots/mosaique.webp', // capture de la fiche Chrome Web Store
    alt: 'Interface de Mosaïque sur fond sombre : les onglets ouverts à gauche, une recherche, des favoris en tuiles (Gmail, SNCF, Météo, Doctolib…) et des groupes colorés comme « Démarches » et « Actualité ».',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension',
  },
  {
    id: 'journey',
    title: 'wwwetzel journey',
    short: 'Mon CV en mini-jeu pixel art.',
    kind: 'Mini-jeu',
    stack: ['Next.js', 'TypeScript'],
    image: '/shots/journey-jeu.webp', // la vraie vue du jeu, en ligne : tout est noir, sauf autour du personnage
    alt: "Écran noir avec un cercle de lumière au centre : en pixel art façon Game Boy, l'héroïne devant une maison aux fenêtres allumées, un petit dragon orange à ses côtés, un étang ; en haut des étoiles, en bas deux orbes d'XP et de mana.",
    // dans la fiche, à côté de la capture : le jeu sur téléphone, avec son joystick
    phone: {
      src: '/shots/journey-mobile.webp',
      alt: "Sur téléphone, l'héroïne entre dans une maison : une bulle annonce « Formation · Sorbonne Nouvelle · Master de lettres · 2015 », un petit dragon orange la suit, un joystick en bas et le sac entre deux orbes.",
    },
    // Servi par ce site, à l'adresse /journey (voir netlify.toml)
    demo: 'https://garancewetz.dev/journey',
    code: 'https://github.com/garancewetz/wwwetzel-journey',
  },
  {
    id: 'murmuration',
    title: 'Murmuration',
    short: 'Une murmuration ascii à Eus',
    kind: 'Animation ASCII',
    stack: ['TypeScript'],
    image: '/shots/murmuration.webp', // capture de la page, en plein vol
    alt: 'Sur un ciel de coucher de soleil, rose fluo puis orange, un grand nuage d’oiseaux dessiné en caractères (des points, des v, des W plus foncés là où ils se croisent) au-dessus d’un village perché, son clocher et ses maisons en escalier, en bas à droite.',
    // Une page de ce site, à l'adresse /murmuration (lien relatif : il marche aussi en local)
    demo: '/murmuration/',
    code: 'https://github.com/garancewetz/portfolio-2026/tree/main/src/features/murmuration',
  },
]
