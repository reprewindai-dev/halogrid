import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('CO2 Grid root mount element "#root" was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
