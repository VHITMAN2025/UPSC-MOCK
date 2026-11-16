import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { attemptService } from '../../services/attemptService'
import { History, Award, CheckCircle2, XCircle, ArrowRight, GitCompare, Loader2, Play } from 'lucide-react'
import { formatScore, formatDate } from '../../lib/utils'

export function AttemptHistoryPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      if (!user) return
      try {
        const data = await attemptService.getUserAttempts(user.id)
        setAttempts(data || [])
      } catch (err) {
        console.error('Error fetching attempt history:', err)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user])

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-xs text-body-secondary font-medium">Fetching attempt history...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-5">
        <div className="w-10 h-10 rounded-xl bg-tnpsc-brand-light text-tnpsc-brand flex items-center justify-center shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-body-text">Exam History & Review Archive</h1>
          <p className="text-xs text-body-secondary mt-0.5">Review all your previous exam attempts and track progress over time</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-border p-12 text-center space-y-4">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-body-text">No Attempts Found</h3>
          <p className="text-xs text-body-secondary max-w-sm mx-auto">
            You haven't attempted any question papers yet. Browse available papers and take your first exam practice!
          </p>
          <Link to="/papers" className="inline-block px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-xs shadow-subtle">
            Browse Papers Catalog
          </Link>
        </div>
      ) : (
        /* Table View - Clean 6-Column Layout as per handoff spec */
        <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-slate-50 border-b border-surface-border text-xs font-bold text-body-secondary uppercase">
            <div className="col-span-4">Session</div>
            <div className="col-span-2">Mode</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Score</div>
            <div className="col-span-1">Accuracy</div>
            <div className="col-span-2">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-surface-border">
            {attempts.map((att) => {
              const isCompleted = att.status === 'completed'
              const isInProgress = att.status === 'in_progress'

              // Determine mode pill styling
              let modePill = { label: 'Full Mock', color: 'bg-purple-100 text-purple-800 border-purple-200' }
              if (att.papers?.exam_type === 'PYQ') {
                modePill = { label: 'PYQ Paper', color: 'bg-green-100 text-green-800 border-green-200' }
              } else if (att.papers?.exam_type === 'Custom') {
                modePill = { label: 'Custom 50Q', color: 'bg-orange-100 text-orange-800 border-orange-200' }
              }

              return (
                <div key={att.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-sm items-center">
                  {/* SESSION */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-2.5">
                      {att.papers?.exam_type === 'PYQ' ? (
                        <span className="text-lg">📜</span>
                      ) : att.papers?.exam_type === 'Custom' ? (
                        <span className="text-lg">📚</span>
                      ) : (
                        <span className="text-lg">⏱</span>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-body-text leading-tight truncate" title={att.papers?.title}>
                          {att.papers?.title || 'TNPSC Question Paper'}
                        </h3>
                        <p className="text-[11px] text-body-secondary truncate">
                          {att.papers?.subject || 'General Studies'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MODE */}
                  <div className="col-span-2">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${modePill.color}`}>
                      {modePill.label}
                    </span>
                  </div>

                  {/* DATE */}
                  <div className="col-span-2 text-xs text-body-secondary">
                    {formatDate(isCompleted ? att.submitted_at : att.started_at)}
                  </div>

                  {/* SCORE */}
                  <div className="col-span-1">
                    {isCompleted ? (
                      <span className="text-sm font-bold text-body-text">
                        {formatScore(att.score)} <span className="text-body-secondary font-normal">/ 200</span>
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700">—</span>
                    )}
                  </div>

                  {/* ACCURACY */}
                  <div className="col-span-1">
                    {isCompleted ? (
                      <span className="text-sm font-bold text-body-text">{att.accuracy}%</span>
                    ) : (
                      <span className="text-xs text-amber-700">—</span>
                    )}
                  </div>

                  {/* ACTION */}
                  <div className="col-span-2">
                    {isCompleted ? (
                      <Link
                        to={`/attempt/${att.id}/result`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-lg text-xs font-bold transition-colors shadow-subtle"
                      >
                        Review
                      </Link>
                    ) : (
                      <Link
                        to={`/exam/${att.paper_id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-subtle"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        Resume
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
