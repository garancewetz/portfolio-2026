import './base.css'
import './header.css'
import './cards.css'
import './lab.css'
import './project.css'
import { setupBackdrop } from './backdrop'
import { setupCards } from './cards'
import { setupHeader } from './header'
import { setupLabGate } from './lab-gate'
import { setupLab } from './lab'
import { setupProject } from './project'
import { setupTrail } from './trail'

// The home page: Garance's places in relief behind the project badges (backdrop.ts); hovering a badge leads to its
// place. A project's page opens in the page itself (project.ts, ?p=id), the lab too (lab.ts, ?labo): the backdrop never
// reloads. Easter egg: zooming out pulls back until the landscape sits in a snow globe (snow-globe.ts).
// The modules call each other only once the page is set up, below, in this order (the header first: the project
// page and the lab catch its clicks; the badges before the lab, which takes them over).

setupTrail()
setupHeader()
setupBackdrop()
setupCards()
setupProject()
setupLab()
setupLabGate()
