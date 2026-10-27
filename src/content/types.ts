// Les types du contenu (voir content.ts)

export interface Person {
  name: string
  github: string
  linkedin: string
}

export interface Project {
  /** l'adresse de sa fiche : #id */
  id: string
  title: string
  /** la phrase qui dit ce que c'est (dans la fiche, et sur mobile) */
  short: string
  /** le type de projet (« Application web 3D »…) */
  kind: string
  stack: string[]
  /** capture 16/10 dans public/shots (WebP, 1200 px de large) */
  image?: string
  alt?: string
  /** dans la fiche (site pensé pour le téléphone) : un écran de téléphone à côté de la capture (WebP, 640 px de
      large, 390 × 844) */
  phone?: Screen
  /** le site, s'il est en ligne */
  demo: string | null
  code: string
  /** en cours, bientôt en ligne */
  wip?: boolean
  /** sur l'accueil, l'intitulé de la section que sa carte ouvre (une autre famille que les projets, sur la ligne
      suivante : « Expériences ») */
  section?: string
  /** plusieurs pages (le carnet) : dans la fiche, leur mosaïque à la place de la capture (chacune mène à sa
      page) ; sur l'accueil, la carte garde sa capture (image) */
  pages?: Page[]
}

/** une page du carnet : son nom, son adresse, sa capture (16/10, WebP, 1200 px de large) et sa description */
export interface Page {
  name: string
  href: string
  src: string
  alt: string
}

/** un écran : son image et sa description */
export interface Screen {
  src: string
  alt: string
}
