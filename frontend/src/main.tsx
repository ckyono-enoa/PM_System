import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { Providers } from './app/Providers'
import { routes } from './app/routes'
import { applyTheme, readStoredTheme } from './app/theme'
import { createQueryClient } from './lib/queryClient'

// Set the theme before the first render so the page does not flash the wrong one.
applyTheme(readStoredTheme())

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
