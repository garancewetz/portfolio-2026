import './abyme.css'
import { mount } from '@/features/carnet/carnet'
import { drawn } from './drawn'

// Abyme : la fenêtre du navigateur, dans la fenêtre du navigateur, dans la fenêtre du navigateur… La fenêtre est
// dessinée, celle du navigateur de la personne (voir drawn.ts) ; on y plonge en faisant défiler.

drawn(document.querySelector<HTMLCanvasElement>('.ab-drawn')!)

// la page dans le carnet (voir features/carnet)
mount()
