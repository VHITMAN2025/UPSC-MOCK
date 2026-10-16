import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, AlertTriangle } from 'lucide-react'
import { TnpscSidebar } from '../components/tnpsc/TnpscSidebar'
import { ToastContainer } from '../components/ui/ToastContainer'
import { AICopilot } from '../components/tnpsc/AICopilot'
import { useApp } from '../contexts/AppContext'
import { apiKeyService } from '../services/apiKeyService'

export function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { hasGeminiApiKey } = useApp()
  const isKeyConfigured = Boolean(hasGeminiApiKey || apiKeyService.hasUserApiKey())

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <TnpscSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-tnpsc-sidebar border-b border-tnpsc-card-border shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-tnpsc-sidebar-item transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-sm">Vina AI · TNPSC</span>
        </header>

        {/* Missing API key notice for user */}
        {!isKeyConfigured && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shrink-0 shadow-2xs border-b border-amber-600">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-100" />
              <span className="truncate">
                <strong>Notice:</strong> Please provide your free Google Gemini API key to activate AI Question Extraction and AI Mentor.
              </span>
            </div>
            <Link
              to="/profile#api-key"
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-lg text-[11px] font-bold transition-colors shrink-0 shadow-2xs"
            >
              Configure Key →
            </Link>
          </div>
        )}

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global UI */}
      <ToastContainer />
      <AICopilot />
    </div>
  )
}
