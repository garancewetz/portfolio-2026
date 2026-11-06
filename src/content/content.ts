// Tout le contenu du site : textes, projets, parcours, liens (le reste du code ne contient pas de texte à changer).
import type { Carnet, Person, Project } from './types'

export const me: Person = {
  name: 'Garance Wetzel',
  github: 'https://github.com/garancewetz',
  linkedin: 'https://www.linkedin.com/in/garancewetzel/',
}

// Parcours, du poste actuel au plus ancien (« Aujourd'hui chez …, avant … et … »)
export const experience: string[] = ['Okeiro', 'Colorz', 'Uptoo']

// Les projets (une carte chacun). demo : lien du site s'il est en ligne ; sinon la carte mène à code.
// wip : en cours, bientôt en ligne. short : la phrase qui dit ce que c'est, écrite par Garance (dans la fiche).
// tags : quelques mots sur le sujet du projet (pas la technique), sous le titre de la carte. kind, stack : les
// détails, affichés dans la fiche du projet (clic sur une carte).
// L'ordre : pour le rythme de la grille en bichromie, une capture claire, une sombre (Synapso, Signe, Handiplan,
// Mosaïque) ; celui qui n'est pas encore en ligne à la fin. (Le CV en jeu, wwwetzel journey, n'y est plus : il parle de Garance, le site montre ses projets ; il
// reste en ligne, sous /journey, voir netlify.toml.)
// image : capture 16/10 dans public/shots (WebP, 1200 px de large). phone : dans la fiche, un écran de téléphone
// à côté (voir types.ts).
export const projects: Project[] = [
  {
    id: 'synapso',
    title: 'Synapso',
    short:
      'Une application de rééducation post-AVC, ou de rééducation tout court, pensée d’abord pour être simple d’utilisation.',
    tags: ['rééducation', 'AVC', 'santé'],
    kind: 'Application mobile (PWA)',
    stack: ['Next.js', 'TypeScript', 'Prisma'],
    image: '/shots/synapso.webp', // capture de la zone « Haut du corps » du site en ligne (800 × 500, faite dans le navigateur de Claude ; l'accueil est déjà dans l'écran de téléphone)
    alt: 'Synapso, la zone « Haut du corps » : les onglets des zones du corps (Visage, Haut, Tronc, Jambes, Étirer), le bouton vert « Lancer la séance » (5 exercices, environ 7 min) et les huit exercices à faire, comme « Serrer une balle », « Cercles du poignet » ou « Bras avec poids ».',
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
    id: 'signe',
    title: 'Signe astronomique',
    short:
      'Une application qui permet de visualiser l’aspect du ciel à la naissance, et donne le réel signe astrologique.',
    tags: ['astronomie', 'ciel', 'naissance'],
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
    id: 'handiplan',
    title: 'Handiplan',
    short: 'Une carte simple des lieux adaptés autour de soi, et des places handicapées.',
    tags: ['handicap', 'accessibilité', 'stationnement'],
    kind: 'Application web (carte)',
    stack: ['TypeScript', 'React', 'Leaflet', 'Tailwind'],
    image: '/shots/handiplan.webp', // capture du site en ligne, avec ses données de démo (?demo, le centre de Paris ; 800 × 500, faite dans le navigateur de Claude)
    alt: 'Handiplan : à gauche, la recherche « Où allez-vous ? », les filtres Tout, Lieux, Se garer et « Les lieux sûrs d’abord », avec leur distance et leurs toilettes adaptées ; à droite, la carte autour de l’Hôtel de Ville de Paris et de la Seine, avec des pictos verts (restaurants, toilettes, cafés) et des places handicapées en bleu.',
    // dans la fiche, à côté de la capture : sur téléphone (fait sur le site en ligne, données de démo)
    phone: {
      src: '/shots/handiplan-mobile.webp',
      alt: 'Sur téléphone : « Près de vous », la recherche, les filtres, la carte avec le bouton « Il y a une place ici », puis « Les lieux sûrs d’abord » avec leur distance.',
    },
    demo: 'https://handiplan.garancewetz.dev/',
    // (pas de lien vers le code : le dépôt est privé)
  },
  {
    id: 'mosaique',
    title: 'Mosaïque',
    short: 'Une extension qui permet d’avoir un accès simplifié et facile d’utilisation aux favoris.',
    tags: ['favoris', 'simplicité', 'autonomie'],
    kind: 'Extension Chrome',
    stack: ['React', 'TypeScript', 'API Chrome'],
    image: '/shots/mosaique.webp', // capture de la fiche Chrome Web Store
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
    image: '/shots/trame.webp', // capture faite avec des données de démo
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, avec des titres comme Le Deuxième Sexe, Gender Trouble ou Sister Outsider, et une frise chronologique en bas.',
    demo: null,
    code: 'https://github.com/garancewetz/Trans-trame',
  },
]

// Le labo (le carnet d'expériences) : sur l'accueil, un lien dans le pied de page ; il mène à son sommaire,
// /labo/, puis on en tourne les pages (voir features/carnet). Chaque page : son nom, son adresse, sa capture
// (16/10, WebP, 1200 px de large) et sa description.
export const carnet: Carnet = {
  href: '/labo/',
  pages: [
    {
      name: 'murmuration',
      href: '/murmuration/',
      src: '/shots/murmuration.webp',
      alt: 'Sur un ciel de crépuscule indigo, un grand nuage d’oiseaux dessiné en caractères aux couleurs d’un coucher de soleil, rose fluo en haut, orange en bas (des points, des v, des W plus denses là où ils se croisent) au-dessus d’un village perché, son clocher et ses maisons en escalier, en bas à droite.',
    },
    {
      name: 'toupies',
      href: '/toupies/',
      src: '/shots/toupies.webp',
      alt: 'Des toupies à pompe en tôle posées sur une page claire ; les deux de devant tournent : l’une, à quartiers de couleurs, fondue en pastels mêlés, l’autre, à rayures noires et blanches, devenue grise ; sous elles, sur la page, le trait fin de leur pointe, bleu et rouge ; au fond, les autres attendent, couchées.',
    },
    {
      name: 'ruban',
      href: '/ruban/',
      src: '/shots/ruban.webp',
      alt: 'Sur un fond noir, un ruban de lumière, coupé par deux silences, ondule de gauche à droite en changeant de couleur avec la note ; un petit yéti en caractères, aux grandes oreilles, grimpe dessus ; sur le bord gauche, la gamme, chaque note à sa hauteur et de sa couleur.',
    },
    {
      name: 'créatures',
      href: '/creatures/',
      src: '/shots/creatures.webp',
      alt: 'Sur une page blanche, des créatures dessinées en caractères dorment chacune sur son bout de ficelle, les yeux fermés, un petit z près de la tête ; deux sont réveillées, un hibou et un yéti : ils sautent sur leur ficelle et laissent derrière eux un trait de leur couleur, vert et rouge, qui garde la forme de leurs sauts.',
    },
    {
      name: 'fourrure',
      href: '/fourrure/',
      src: '/shots/fourrure.webp',
      alt: 'Dans le noir, un chat gris dessiné en caractères très serrés, à peine éclairé : ses pattes, son poitrail et son dos sortent de l’ombre là où la lumière est passée.',
    },
    {
      name: 'abyme',
      href: '/abyme/',
      src: '/shots/abyme.webp',
      alt: 'Une fenêtre de navigateur ouverte sur la page Toupies ; dedans, une fenêtre plus petite sur la page Fourrure, toute noire, puis une sur Murmuration, et tout au fond, l’accueil du site.',
    },
  ],
}
