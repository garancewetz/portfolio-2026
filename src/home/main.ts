import './base.css'
import './header.css'
import './cards.css'
import './lab.css'
import './note.css'
import { roam } from '@/features/mascots/roam'
import { setupBackdrop } from './backdrop'
import { setupCards } from './cards'
import { setupHeader } from './header'
import { setupLab } from './lab'
import { setupNote } from './note'
import { setupTrail } from './trail'
import { setupWheel } from './wheel'

// The home page: Garance's places in relief behind the project badges (backdrop.ts); hovering a badge leads to its
// place and writes its sentence, a click keeps it with its links (note.ts). The lab opens in the page itself (lab.ts,
// /lab/): the backdrop never reloads. Easter egg: zooming out pulls back until the landscape sits in a snow globe
// (snow-globe.ts).
// The modules call each other only once the page is set up, below, in this order (the header first: the lab catches
// its clicks; the badges before the lab, which takes them over).

setupTrail()
setupWheel()
setupHeader()
setupBackdrop()
setupCards()
setupNote()
setupLab()
// the mascots freed on the Mascottes page fly over the home page too (see features/mascots/roam.ts)
void roam()
