import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, AlertTriangle } from 'lucide-react'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { ToastContainer } from '../components/ui/ToastContainer'
import { useApp } from '../contexts/AppContext'
import { apiKeyService } from '../services/apiKeyService'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { hasGeminiApiKey } = useApp()
  const isKeyConfigured = Boolean(hasGeminiApiKey || apiKeyService.hasUserApiKey())

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-tnpsc-sidebar border-b border-tnpsc-card-border shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-tnpsc-sidebar-item"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-sm">Vina AI · Admin</span>
        </header>

        {/* Global Missing API Key Warning Bar */}
        {!isKeyConfigured && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 shrink-0 shadow-sm border-b border-amber-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
              <span className="truncate">
                <strong>Action Required:</strong> Google Gemini API Key is not configured yet. AI question extraction, syllabus unit categorization, and AI mentor features require a Gemini API key.
              </span>
            </div>
            <Link
              to="/admin/settings"
              className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-subtle flex items-center gap-1"
            >
              Configure in Settings →
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
