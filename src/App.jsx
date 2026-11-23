import React from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { createAppRoutes } from './routes/AppRoutes'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create router with data router API (required for useBlocker)
const router = createBrowserRouter(createAppRoutes())

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
