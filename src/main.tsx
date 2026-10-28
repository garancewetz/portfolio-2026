import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/base.css'
import App from '@/app/App'
import { remember } from '@/shared/trail'

// pour qui ouvre l'inspecteur : un commentaire
console.log('%c/* tu lis le code ? il est là : github.com/garancewetz */', 'font-family: monospace; color: #5f5a52')

// (le chemin de la visite, pour la page Abyme du carnet)
remember()
// (montrée au fond d'Abyme, dans une iframe : ses liens s'ouvrent dans la fenêtre entière, pas dans l'iframe)
if (window !== window.top) document.head.append(Object.assign(document.createElement('base'), { target: '_top' }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
