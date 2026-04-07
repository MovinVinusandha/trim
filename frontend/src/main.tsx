import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { SkeletonTheme } from 'react-loading-skeleton'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkeletonTheme baseColor="var(--skeleton-base-color)" highlightColor="var(--skeleton-highlight-color)">
      <App />
    </SkeletonTheme>
  </StrictMode>,
)
