// Tout le contenu du site : textes, projets, parcours, liens.
export const me = {
  name: 'Garance Wetzel',
  role: 'Développeuse front-end',
  intro: 'Ici, les projets qui ont survécu.',
  github: 'https://github.com/garancewetz',
  email: 'garance.wetzel@gmail.com',
}

// Repris de wwwetzel-journey (datas/xps.json). TODO Garance : vérifier les dates.
export const experience = [
  {
    company: 'Okeiro',
    about: 'Télésurveillance médicale des patients transplantés.',
    period: '2025 — aujourd’hui',
    summary: 'Développement front en React, Next.js et Tailwind.',
  },
  {
    company: 'Colorz',
    about: 'Agence digitale parisienne, partenaire Shopify.',
    period: '2023 — 2025',
    summary:
      'En agence : sites e-commerce Shopify (Paprika, Husbands, Cabaïa, AMI, Mathon), applications web (Mapz, Station-e, Woozwoo) et sites événementiels.',
  },
  {
    company: 'Uptoo',
    about: 'Recrutement et formation de commerciaux.',
    period: '2019 — 2021',
    summary: 'Site vitrine, blog, plateforme de tests et plateforme de formation pour un cabinet de recrutement.',
  },
]

export const education = [
  { school: 'OpenClassrooms', period: '2022', title: 'Développeuse d’application web' },
  { school: '3W Academy', period: '2018', title: 'Développeuse web' },
  { school: 'Sorbonne Nouvelle', period: '2015', title: 'Master de lettres modernes' },
]

export const projects = [
  {
    id: 'signe',
    color: '#6f8fd8',
    title: 'Signe astronomique',
    year: '2026',
    kind: 'Application web 3D',
    short: 'Calcule ton vrai signe à partir de la position réelle du Soleil dans le ciel.',
    long: 'Les horoscopes utilisent un découpage vieux de 2 000 ans. Ce site calcule le signe réel selon les constellations officielles (IAU 1930) et le décalage des équinoxes — Ophiuchus inclus. La Terre et les satellites sont affichés en 3D, en temps réel.',
    stack: ['TypeScript', 'React', 'Cesium', 'SGP4'],
    image: '/shots/signe.jpg',
    alt: 'Interface de Signe astronomique : un formulaire de date de naissance à gauche, la Terre en 3D sur fond étoilé à droite.',
    demo: 'https://signe-astronomique.netlify.app/',
    code: 'https://github.com/garancewetz/signe-astronomique',
  },
  {
    id: 'synapso',
    color: '#7fb69a',
    title: 'Synapso',
    year: '2026',
    kind: 'Application mobile (PWA)',
    short: 'Accompagne la rééducation après un AVC, un exercice à la fois.',
    long: 'Exercices quotidiens rangés par catégories, suivi de progression, journal personnel et partage avec le ou la kiné. L’interface est pensée pour rester simple à utiliser malgré des difficultés motrices ou cognitives.',
    stack: ['Next.js', 'TypeScript', 'Prisma'],
    image: '/shots/synapso.jpg', // capture faite avec un compte et des données de démo
    alt: 'Page « Ma progression » de Synapso : un calendrier des 28 derniers jours rempli de pastilles vertes, une série de 14 jours, les exercices par zone du corps et une liste de progrès notés.',
    demo: 'https://synapso.netlify.app/',
    code: 'https://github.com/garancewetz/synapso-app-reeducation',
  },
  {
    id: 'trame',
    wip: true, // en cours : bientôt en ligne (en attendant, la carte mène au code)
    color: '#b48ad6',
    title: 'Trans-trame',
    year: '2025',
    kind: 'Visualisation de données',
    short: 'Une carte des livres et de la manière dont ils se citent entre eux.',
    long: 'Chaque ouvrage est un point, chaque citation un lien. On peut explorer le graphe, filtrer par période ou par auteur·ice, et contribuer en ajoutant des références.',
    stack: ['React', 'TypeScript', 'Supabase'],
    image: '/shots/trame.jpg', // capture faite avec des données de démo
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, avec des titres comme Le Deuxième Sexe, Gender Trouble ou Sister Outsider, et une frise chronologique en bas.',
    demo: null,
    code: 'https://github.com/garancewetz/Trans-trame',
  },
  {
    id: 'mosaique',
    color: '#d9a35b',
    title: 'Mosaïque',
    year: '2025',
    kind: 'Extension Chrome',
    short: 'Remplace l’onglet vide de Chrome par tes sites favoris, rangés par thèmes.',
    long: 'Les favoris deviennent des tuiles, organisées en groupes que l’on déplace par glisser-déposer. Les onglets ouverts sont visibles sur le côté pour les ranger en un geste.',
    stack: ['React', 'TypeScript', 'API Chrome'],
    image: '/shots/mosaique.jpg',
    alt: 'Interface de Mosaïque sur fond sombre : les onglets ouverts à gauche, une recherche, des favoris en tuiles (Gmail, SNCF, Météo, Doctolib…) et des groupes colorés comme « Démarches » et « Actualité ».',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension',
  },
  {
    id: 'journey',
    color: '#e0867a',
    title: 'wwwetzel journey',
    year: '2025',
    kind: 'Mini-jeu',
    short: 'Mon parcours raconté comme un petit jeu vidéo à explorer au clavier.',
    long: 'Un personnage se déplace dans un décor en pixel art et découvre mes expériences en chemin. Un essai ludique, à côté d’un portfolio plus classique.',
    stack: ['Next.js', 'Framer Motion'],
    image: '/shots/journey.jpg',
    alt: 'Carte en pixel art : un personnage sur un chemin de terre, entouré d’arbres, d’une rivière et d’objets à découvrir (un livre, un piano, un champignon).',
    demo: null,
    code: 'https://github.com/garancewetz/wwwetzel-journey',
  },
]

// Les projets abandonnés (dépôts privés) : un bandeau qui défile, comme du code mis en commentaire,
// tout en bas, si l'on continue à scroller après la fin. Pas de lien : ils ne sont pas en ligne.
// Une phrase archi courte qui dit le fond du projet (pas sa forme). wip : pas abandonné, en cours (« TODO »).
export const abandoned = [
  { id: 'sarah-bernhardt', title: 'Sarah Bernhardt — Divine Édition', year: '2026', line: 'Faire revivre Sarah Bernhardt dans le navigateur.' },
  { id: 'quand-meme', title: 'Quand Même', year: '2026', line: 'La vie de Sarah Bernhardt, d’après ses mémoires.' },
  { id: 'trame', title: 'Trame', year: '2026', line: 'Voir comment les personnages d’un roman se croisent.' },
  { id: 'melangeur-de-vers', wip: true, title: 'Mélangeur de vers', year: '2026', line: 'Faire entendre les poétesses du matrimoine.' },
  { id: 'collections', title: 'Mes collections', year: '2026', line: 'Les dessins animés de mon enfance.' },
  { id: 'portfolios', title: 'Portfolios 2024 et 2025', year: '2024', line: 'Les versions précédentes de ce site.' },
  { id: 'maurice-et-les-autres', title: 'Maurice et les autres', year: '2022', line: 'Les spectacles d’une compagnie de théâtre.' },
  { id: 'poet-mixer', title: 'Poet Mixer', year: '2022', line: 'Écrire de nouveaux poèmes avec les vers des autres.' },
  { id: 'where-is-yaya', title: 'Where is Yaya', year: '2021', line: 'Un souvenir de voyage Nice – Paris.' },
  { id: 'poetry-verse-mixer', title: 'Poetry verse mixer', year: '2022', line: 'Croiser les vers d’Artaud et de Miguel Hernández.' },
]
