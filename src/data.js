// Tout le contenu du site : textes, projets, parcours, liens.
export const me = {
  name: 'Garance Wetzel',
  role: 'Développeuse front-end',
  github: 'https://github.com/garancewetz',
  linkedin: 'https://www.linkedin.com/in/garancewetzel/',
  email: 'garance.wetzel@gmail.com',
}

// Parcours, du poste actuel au plus ancien (« Aujourd'hui chez …, avant … et … »)
export const experience = ['Okeiro', 'Colorz', 'Uptoo']

// Les projets (une carte chacun). demo : lien du site s'il est en ligne ; sinon la carte mène à code.
// wip : en cours, bientôt en ligne. short : la phrase simple qui dit ce que c'est (dans la fiche, et sur mobile).
// year, kind, long, stack : les détails, affichés dans la fiche du projet (clic sur une carte).
// image : capture 16/10 dans public/shots (WebP, 1200 px de large).
export const projects = [
  {
    id: 'signe',
    color: '#6f8fd8',
    title: 'Signe astronomique',
    short: 'Calcule ton vrai signe à partir de la position réelle du Soleil dans le ciel.',
    year: '2026',
    kind: 'Application web 3D',
    long: 'Les horoscopes utilisent un découpage vieux de 2 000 ans. Ce site calcule le signe réel selon les constellations officielles (IAU 1930) et le décalage des équinoxes — Ophiuchus inclus. La Terre et les satellites sont affichés en 3D, en temps réel.',
    stack: ['TypeScript', 'React', 'Cesium', 'SGP4'],
    image: '/shots/signe.webp',
    alt: 'Interface de Signe astronomique : un formulaire de date de naissance à gauche, la Terre en 3D sur fond étoilé à droite.',
    demo: 'https://signe-astronomique.netlify.app/',
    code: 'https://github.com/garancewetz/signe-astronomique',
  },
  {
    id: 'synapso',
    color: '#7fb69a',
    title: 'Synapso',
    short: 'Accompagne la rééducation après un AVC, un exercice à la fois.',
    year: '2026',
    kind: 'Application mobile (PWA)',
    long: 'Exercices quotidiens rangés par catégories, suivi de progression, journal personnel et partage avec le ou la kiné. L’interface est pensée pour rester simple à utiliser malgré des difficultés motrices ou cognitives.',
    stack: ['Next.js', 'TypeScript', 'Prisma'],
    image: '/shots/synapso.webp', // capture faite avec un compte et des données de démo
    alt: 'Page « Ma progression » de Synapso : un calendrier des 28 derniers jours rempli de pastilles vertes, une série de 14 jours, les exercices par zone du corps et une liste de progrès notés.',
    demo: 'https://synapso.netlify.app/',
    code: 'https://github.com/garancewetz/synapso-app-reeducation',
  },
  {
    id: 'trame',
    wip: true,
    color: '#b48ad6',
    title: 'Trans-trame',
    short: 'Une carte des livres et de la manière dont ils se citent entre eux.',
    year: '2025',
    kind: 'Visualisation de données',
    long: 'Chaque ouvrage est un point, chaque citation un lien. On peut explorer le graphe, filtrer par période ou par auteur·ice, et contribuer en ajoutant des références.',
    stack: ['React', 'TypeScript', 'Supabase'],
    image: '/shots/trame.webp', // capture faite avec des données de démo
    alt: 'Graphe de Trans-trame sur fond sombre : des cercles colorés, un par livre, reliés par des lignes de citation, avec des titres comme Le Deuxième Sexe, Gender Trouble ou Sister Outsider, et une frise chronologique en bas.',
    demo: null,
    code: 'https://github.com/garancewetz/Trans-trame',
  },
  {
    id: 'mosaique',
    color: '#d9a35b',
    title: 'Mosaïque',
    short: 'Remplace l’onglet vide de Chrome par tes sites favoris, rangés par thèmes.',
    year: '2025',
    kind: 'Extension Chrome',
    long: 'Les favoris deviennent des tuiles, organisées en groupes que l’on déplace par glisser-déposer. Les onglets ouverts sont visibles sur le côté pour les ranger en un geste.',
    stack: ['React', 'TypeScript', 'API Chrome'],
    image: '/shots/mosaique.webp', // capture de la fiche Chrome Web Store
    alt: 'Interface de Mosaïque sur fond sombre : les onglets ouverts à gauche, une recherche, des favoris en tuiles (Gmail, SNCF, Météo, Doctolib…) et des groupes colorés comme « Démarches » et « Actualité ».',
    demo: 'https://chromewebstore.google.com/detail/mosa%C3%AFque-%E2%80%94-onglets-favori/hjbbfpkhfclkaefafhbkjocbpkgnlnpd',
    code: 'https://github.com/garancewetz/mosaique-chrome-extension',
  },
  {
    id: 'journey',
    color: '#e0867a',
    title: 'wwwetzel journey',
    short: 'Mon parcours raconté comme un petit jeu vidéo à explorer au clavier.',
    year: '2025',
    kind: 'Mini-jeu',
    long: 'Un personnage se déplace dans un décor en pixel art et découvre mes expériences en chemin. Un essai ludique, à côté d’un portfolio plus classique.',
    stack: ['Next.js', 'Framer Motion'],
    image: '/shots/journey.webp',
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
