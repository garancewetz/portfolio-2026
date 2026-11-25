import './abyme.css'
import { mount } from '@/features/carnet/carnet'
import { drawn } from './drawn'

// Abyme: the browser window, inside the browser window, inside the browser window… The window is drawn, the
// visitor's own browser (see drawn.ts); you dive into it by scrolling.

drawn(document.querySelector<HTMLCanvasElement>('.ab-drawn')!)

// the page in the notebook (see features/carnet)
mount()
