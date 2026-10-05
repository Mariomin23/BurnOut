import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Activa la hoja de fuentes cargada sin bloquear el render (ver index.html)
const fonts = document.getElementById('app-fonts') as HTMLLinkElement | null
if (fonts) fonts.media = 'all'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
