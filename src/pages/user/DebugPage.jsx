import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { supabase } from '../../lib/supabase'

export function DebugPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { selectedExam } = useApp()
  const [dbCheck, setDbCheck] = useState({})
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkDatabase() {
      if (!user?.id) {
        setChecking(false)
        return
      }

      const results = {}

      // Check user_streaks
      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        results.user_streaks = { data, error: error?.message }
      } catch (err) {
        results.user_streaks = { error: err.message }
      }

      // Check attempts
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .limit(5)
        results.attempts = { data, count: data?.length, error: error?.message }
      } catch (err) {
        results.attempts = { error: err.message }
      }

      // Check current_affairs
      try {
        const { data, error } = await supabase
          .from('current_affairs')
          .select('*')
          .eq('is_active', true)
          .limit(4)
        results.current_affairs = { data, count: data?.length, error: error?.message }
      } catch (err) {
        results.current_affairs = { error: err.message }
      }

      // Check government_notifications
      try {
        const { data, error } = await supabase
          .from('government_notifications')
          .select('*')
          .limit(3)
        results.government_notifications = { data, count: data?.length, error: error?.message }
      } catch (err) {
        results.government_notifications = { error: err.message }
      }

      // Check user_notes
      try {
        const { data, error } = await supabase
          .from('user_notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_pinned', true)
          .limit(3)
        results.user_notes = { data, count: data?.length, error: error?.message }
      } catch (err) {
        results.user_notes = { error: err.message }
      }

      // Check exam_sessions
      try {
        const { data, error } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
        results.exam_sessions = { data, count: data?.length, error: error?.message }
      } catch (err) {
        results.exam_sessions = { error: err.message }
      }

      setDbCheck(results)
      setChecking(false)
    }

    checkDatabase()
  }, [user?.id])

  if (authLoading || checking) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Dashboard</h1>

      {/* Auth Status */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Authentication Status</h2>
        <div className="space-y-1 text-sm">
          <p><strong>Logged In:</strong> {user ? '✅ Yes' : '❌ No'}</p>
          {user && (
            <>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Profile Loaded:</strong> {profile ? '✅ Yes' : '❌ No'}</p>
              {profile && (
                <>
                  <p><strong>Full Name:</strong> {profile.full_name}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Selected Exam:</strong> {selectedExam}</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Database Checks */}
      {user && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Database Tables Check</h2>

          {Object.entries(dbCheck).map(([table, result]) => (
            <div key={table} className="bg-white rounded-lg border p-4">
              <h3 className="font-bold text-sm mb-2">{table}</h3>
              {result.error ? (
                <p className="text-red-600 text-sm">❌ Error: {result.error}</p>
              ) : (
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✅ Table accessible</p>
                  <p><strong>Records found:</strong> {result.count || 0}</p>
                  {result.data && result.count > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:underline">
                        View data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ You are not logged in. Please log in to see user-specific data.
          </p>
        </div>
      )}
    </div>
  )
}
