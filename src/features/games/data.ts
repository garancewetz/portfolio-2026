// The games of Garance's childhood (from her « collections » project), by year, then by title. Each has a screenshot (public/games/<slug>.webp) and most a second one (<slug>-2.webp), shown on hover.
// big: a game she loved, twice as large in the mosaic (its screenshots at their full size)
// more: a game with more screenshots (<slug>-3.webp…), shown one after the other on hover: how many in all
export type Game = { title: string; year: number; slug: string; single?: boolean; big?: boolean; more?: number }

export const GAMES: Game[] = [
  { title: 'Doctor Spin', year: 1992, slug: 'doctor-spin' },
  { title: 'Super Maze Wars', year: 1993, slug: 'super-maze-wars' },
  { title: 'Marine Malice', year: 1994, slug: 'marine-malice', big: true },
  { title: 'Au cirque avec Seurat', year: 1996, slug: 'au-cirque-avec-seurat', single: true },
  { title: 'Adibou', year: 1996, slug: 'adibou' },
  { title: 'Carmen Sandiego (Version 2)', year: 1996, slug: 'carmen-sandiego-version-2' },
  { title: 'Les Zoombinis', year: 1996, slug: 'les-zoombinis', big: true, more: 3 },
  { title: 'Adi 4', year: 1997, slug: 'adi-4' },
  { title: 'Age of Empires', year: 1997, slug: 'age-of-empires' },
  { title: 'Bub & Bob', year: 1997, slug: 'bub-bob' },
  { title: 'Dessinez, c’est Disney', year: 1997, slug: 'dessinez-cest-disney' },
  { title: 'Le Maître des Éléments', year: 1997, slug: 'le-maitre-des-elements', big: true },
  { title: 'Le Petit Prince', year: 1997, slug: 'le-petit-prince', more: 3 },
  { title: 'Les Shadoks : La Promenade', year: 1997, slug: 'les-shadoks-la-promenade', more: 4 },
  { title: 'Jeune Styliste', year: 1998, slug: 'jeune-styliste' },
  { title: 'La Reine des Neiges', year: 1998, slug: 'la-reine-des-neiges' },
  { title: 'CDromadaire', year: 1999, slug: 'cdromadaire' },
  { title: 'Le Fabuleux Voyage de l’Oncle Ernest', year: 1999, slug: 'le-fabuleux-voyage-de-loncle-ernest', big: true, more: 3 },
  { title: 'Star Wars Episode I: Racer', year: 1999, slug: 'star-wars-episode-i-racer' },
  { title: 'Theme Park World', year: 1999, slug: 'theme-park-world', big: true },
  { title: '4x4 Evolution', year: 2000, slug: '4x4-evolution' },
  { title: 'Artus contre le Démon du Musée', year: 2000, slug: 'artus-contre-le-demon-du-musee' },
  { title: 'Diablo 2', year: 2000, slug: 'diablo-2', big: true },
  { title: 'Le Retour des Incroyables Machines', year: 2000, slug: 'le-retour-des-incroyables-machines' },
  { title: 'Les Zoombinis 2', year: 2001, slug: 'zoombinis-mountain-rescue' },
  { title: 'Oni', year: 2001, slug: 'oni', big: true },
  { title: 'Marble Blast Gold', year: 2003, slug: 'marble-blast-gold' },
  { title: 'Nanosaur 2', year: 2004, slug: 'nanosaur-2' },
  { title: 'Les Sims 2', year: 2004, slug: 'les-sims-2' },
  { title: 'World of Warcraft', year: 2004, slug: 'world-of-warcraft', big: true },
]
