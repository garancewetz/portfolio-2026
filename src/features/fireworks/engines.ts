// Les moteurs du mode feu d'artifice de l'accueil, réunis pour être chargés d'un coup, à la première mise en route
// (Fireworks.tsx les importe à la demande, par ce seul fichier).
// (pourquoi un fichier à part : un import() dynamique de show.ts ou fluid.ts obligerait le bundler à leur fabriquer
// un « namespace », avec une aide rangée dans le code de l'accueil ; la page Feu d'artifice, qui importe show.ts et
// fluid.ts, chargerait alors tout l'accueil, qui cherche son #root et plante. Le namespace est fabriqué ici, que
// seul l'accueil charge.)
export { COLORS, createShow } from './show'
export { createFluid } from './fluid'
