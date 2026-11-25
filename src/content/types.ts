// The content types (see content.ts)

export interface Person {
  name: string
  github: string
  linkedin: string
}

export interface Project {
  /** the address of its sheet: #id */
  id: string
  title: string
  /** the sentence that says what it is (in the sheet, and on mobile) */
  short: string
  /** a few keywords, under the card title (« handicap », « astronomie »…) */
  tags: string[]
  /** the kind of project (« Application web 3D »…) */
  kind: string
  stack: string[]
  /** 16/10 screenshot in public/shots (WebP, 1200 px wide) */
  image?: string
  alt?: string
  /** in the sheet (site designed for phones): a phone screen beside the screenshot (WebP, 640 px wide,
      390 × 844) */
  phone?: Screen
  /** the site, if it is online */
  demo: string | null
  /** the code on GitHub (absent: the repository is private) */
  code?: string
  /** in progress, online soon */
  wip?: boolean
}

/** the notebook of experiments: the address of its table of contents, its pages */
export interface Carnet {
  href: string
  pages: Page[]
}

/** a page of the notebook: its name, its address, its screenshot (16/10, WebP, 1200 px wide) and its
    description */
interface Page {
  name: string
  href: string
  src: string
  alt: string
}

/** a screen: its image and its description */
interface Screen {
  src: string
  alt: string
}
