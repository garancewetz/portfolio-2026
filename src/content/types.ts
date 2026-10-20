// Les types du contenu (voir content.ts)

export interface Person {
  name: string
  role: string
  github: string
  linkedin: string
}

export interface Project {
  /** l'adresse de sa fiche : #id */
  id: string
  title: string
  /** la phrase simple qui dit ce que c'est (dans la fiche, et sur mobile) */
  short: string
  year: string
  /** le type de projet (« Application web 3D »…) */
  kind: string
  /** la description, dans la fiche */
  long: string
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
}

/** un écran : son image et sa description */
export interface Screen {
  src: string
  alt: string
}

export interface AbandonedProject {
  id: string
  title: string
  year: string
  /** une phrase archi courte qui dit le fond du projet */
  line: string
  /** pas abandonné : en cours (« TODO ») */
  wip?: boolean
}
