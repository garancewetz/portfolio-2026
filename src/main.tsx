import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/base.css'
import App from '@/app/App'

// pour qui ouvre l'inspecteur : un commentaire
console.log('%c/* tu lis le code ? il est là : github.com/garancewetz */', 'font-family: monospace; color: #5f5a52')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
