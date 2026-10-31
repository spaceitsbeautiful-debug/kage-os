import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log(
  '%c影OS%c  conçu et développé par Gounteni David · 2026\nEssaie la commande « help » dans le Terminal.',
  'font: 800 28px serif; color: #c4b5e8;',
  'font: 12px monospace; color: #8d8aa3;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
