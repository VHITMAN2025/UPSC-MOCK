import { supabase } from '../lib/supabase'
import { syllabusAnalyticsService, CANONICAL_SYLLABUS_TAXONOMY } from './syllabusAnalyticsService.js'
import { apiKeyService } from './apiKeyService.js'

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const adminStatsService = {
  async getAll() {
    const [
      papersRes, questionsRes, attemptsRes,
      usersRes, affairsRes, notifsRes,
      recallRes, syllabusUnitsRes, syllabusTopicsRes,
      practiceRes, notesRes, byopRes,
    ] = await Promise.allSettled([
      supabase.from('papers').select('id,status'),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('attempts').select('id,status,score,accuracy'),
      supabase.from('profiles').select('id,role,created_at'),
      supabase.from('current_affairs').select('id,status,is_active'),
      supabase.from('government_notifications').select('id,status,application_end'),
      supabase.from('recall_questions').select('id,is_active'),
      supabase.from('syllabus_units').select('id'),
      supabase.from('syllabus_topics').select('id'),
      supabase.from('practice_sessions').select('id,status'),
      supabase.from('user_notes').select('id'),
      supabase.from('uploaded_papers').select('id,processing_status'),
    ])

    const papers   = papersRes.status === 'fulfilled'   ? papersRes.value.data   ?? [] : []
    const totalQ   = questionsRes.status === 'fulfilled' ? questionsRes.value.count ?? 0 : 0
    const attempts = attemptsRes.status === 'fulfilled'  ? attemptsRes.value.data ?? [] : []
    const users    = usersRes.status === 'fulfilled'     ? usersRes.value.data    ?? [] : []
    const affairs  = affairsRes.status === 'fulfilled'   ? affairsRes.value.data  ?? [] : []
    const notifs   = notifsRes.status === 'fulfilled'    ? notifsRes.value.data   ?? [] : []
    const recall   = recallRes.status === 'fulfilled'    ? recallRes.value.data   ?? [] : []
    const units    = syllabusUnitsRes.status === 'fulfilled' ? syllabusUnitsRes.value.data ?? [] : []
    const topics   = syllabusTopicsRes.status === 'fulfilled' ? syllabusTopicsRes.value.data ?? [] : []
    const practice = practiceRes.status === 'fulfilled'  ? practiceRes.value.data ?? [] : []
    const byop     = byopRes.status === 'fulfilled'      ? byopRes.value.data     ?? [] : []

    const now    = new Date()
    const today  = new Date(now); today.setHours(0,0,0,0)
    const week   = new Date(now); week.setDate(now.getDate() - 7)

    const completed = attempts.filter(a => a.status === 'completed')
    const avgScore  = completed.length
      ? (completed.reduce((s, a) => s + Number(a.score ?? 0), 0) / completed.length).toFixed(1)
      : 0
    const avgAcc    = completed.length
      ? (completed.reduce((s, a) => s + Number(a.accuracy ?? 0), 0) / completed.length).toFixed(1)
      : 0

    // Alerts
    const alerts = []
    if (!apiKeyService.hasUserApiKey()) {
      alerts.push({
        type: 'warning',
        msg: 'Google Gemini API Key is not configured — AI Question Extraction, Syllabus Classification, and AI Tutor require a key in Admin Settings.'
      })
    }
    const expiring = notifs.filter(n => {
      if (!n.application_end) return false
      const d = new Date(n.application_end)
      const diff = (d - now) / 86400000
      return diff > 0 && diff <= 7
    })
    if (expiring.length) alerts.push({ type: 'warning', msg: `${expiring.length} notification(s) deadline within 7 days` })

    const draftsAffairs = affairs.filter(a => a.status === 'draft' || a.status === 'review')
    if (draftsAffairs.length) alerts.push({ type: 'info', msg: `${draftsAffairs.length} current affair(s) pending publish` })

    const failedByop = byop.filter(b => b.processing_status === 'failed')
    if (failedByop.length) alerts.push({ type: 'error', msg: `${failedByop.length} BYOP upload(s) failed processing` })

    if (totalQ === 0) alerts.push({ type: 'warning', msg: 'No questions in bank — Quick Recall & Practice will not work' })

    return {
      // Content
      totalPapers:     papers.length,
      publishedPapers: papers.filter(p => p.status === 'published').length,
      draftPapers:     papers.filter(p => p.status === 'draft').length,
      totalQuestions:  totalQ,
      totalUnits:      units.length,
      totalTopics:     topics.length,
      totalAffairs:    affairs.length,
      publishedAffairs: affairs.filter(a => a.status === 'published' || a.is_active).length,
      totalNotifs:     notifs.length,
      activeNotifs:    notifs.filter(n => n.status === 'active').length,
      totalRecall:     recall.length,
      activeRecall:    recall.filter(r => r.is_active).length,
      // Users
      totalUsers:      users.filter(u => u.role !== 'admin').length,
      totalAdmins:     users.filter(u => u.role === 'admin').length,
      newUsersWeek:    users.filter(u => new Date(u.created_at) >= week).length,
      // Attempts
      totalAttempts:    attempts.length,
      completedAttempts: completed.length,
      avgScore,
      avgAccuracy: avgAcc,
      // Practice
      practiceSessions: practice.length,
      completedPractice: practice.filter(p => p.status === 'completed').length,
      // Alerts
      alerts,
    }
  },
}

// ─── Current Affairs admin ────────────────────────────────────────────────────
export const adminAffairsService = {
  async getAll(filters = {}) {
    let q = supabase.from('current_affairs').select('*').order('created_at', { ascending: false })
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
    if (filters.search) q = q.ilike('title', `%${filters.search}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  async upsert(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('current_affairs')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('current_affairs').insert([payload]).select().single()
    if (error) throw error
    return data
  },

  async setStatus(id, status) {
    const isActive = status === 'published'
    const { data, error } = await supabase
      .from('current_affairs')
      .update({ status, is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('current_affairs').update({ status: 'archived', is_active: false }).eq('id', id)
    if (error) throw error
  },
}

// ─── Government Notifications admin ──────────────────────────────────────────
export const adminNotifService = {
  async getAll(filters = {}) {
    let q = supabase.from('government_notifications').select('*').order('created_at', { ascending: false })
    if (filters.department && filters.department !== 'all') q = q.eq('department', filters.department)
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.search) q = q.ilike('title', `%${filters.search}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  async upsert(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('government_notifications')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('government_notifications').insert([payload]).select().single()
    if (error) throw error
    return data
  },

  async setStatus(id, status) {
    const { data, error } = await supabase
      .from('government_notifications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('government_notifications').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Syllabus admin ───────────────────────────────────────────────────────────
export const adminSyllabusService = {
  async getExams() {
    try {
      const { data, error } = await supabase.from('syllabus_exams').select('*').order('display_order')
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Fallback to standard exams:', e)
    }
    return [
      { id: 'grp-4', exam_name: 'TNPSC Group 4', code: 'GRP4', display_order: 1 },
      { id: 'grp-2', exam_name: 'TNPSC Group 2/2A', code: 'GRP2', display_order: 2 },
      { id: 'grp-1', exam_name: 'TNPSC Group 1', code: 'GRP1', display_order: 3 },
    ]
  },

  async upsertExam(payload, id = null) {
    if (id) {
      const { data, error } = await supabase.from('syllabus_exams').update(payload).eq('id', id).select().single()
      if (error) throw error; return data
    }
    const { data, error } = await supabase.from('syllabus_exams').insert([payload]).select().single()
    if (error) throw error; return data
  },

  async getFullTaxonomy(examName = 'TNPSC Group 4') {
    const hierarchy = await syllabusAnalyticsService.buildHierarchy(examName)
    const allMicroTopics = hierarchy.units.flatMap(u =>
      u.macro_topics.flatMap(mt => mt.micro_topics)
    )

    // Pull questions count from questions table & uploaded_papers
    const [qRes, byopRes] = await Promise.allSettled([
      supabase.from('questions').select('id, question_text, option_a, option_b, option_c, option_d, explanation, unit_name, macro_topic_name, micro_topic_name'),
      supabase.from('uploaded_papers').select('id, questions_json'),
    ])

    const dbQuestions = qRes.status === 'fulfilled' ? (qRes.value.data || []) : []
    const byopPapers = byopRes.status === 'fulfilled' ? (byopRes.value.data || []) : []

    // Collect all uploaded questions
    const allQuestions = [...dbQuestions]
    byopPapers.forEach(p => {
      let qList = []
      if (Array.isArray(p.questions_json)) qList = p.questions_json
      else if (typeof p.questions_json === 'string' && p.questions_json.length > 2) {
        try { qList = JSON.parse(p.questions_json) } catch {}
      }
      qList.forEach((q, idx) => {
        allQuestions.push({
          id: `byop-${p.id}-${idx}`,
          question_text: q.question_text || q.question_text_english || q.tamil_question || '',
          unit_name: q.unit_name,
          macro_topic_name: q.macro_topic_name,
          micro_topic_name: q.micro_topic_name,
        })
      })
    })

    const microCountMap = new Map()
    const macroCountMap = new Map()
    const unitCountMap = new Map()

    allQuestions.forEach(q => {
      let matched = null
      if (q.micro_topic_name) {
        matched = allMicroTopics.find(m => m.micro_topic_name?.toLowerCase() === q.micro_topic_name?.toLowerCase())
      }
      if (!matched) {
        matched = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, allMicroTopics)
      }
      if (matched) {
        microCountMap.set(matched.micro_topic_id, (microCountMap.get(matched.micro_topic_id) || 0) + 1)
        macroCountMap.set(matched.macro_topic_id, (macroCountMap.get(matched.macro_topic_id) || 0) + 1)
        unitCountMap.set(matched.unit_id, (unitCountMap.get(matched.unit_id) || 0) + 1)
      }
    })

    let totalQuestionsCount = 0
    let totalMacrosCount = 0
    let totalMicrosCount = 0

    const enrichedUnits = hierarchy.units.map(u => {
      const uCount = unitCountMap.get(u.unit_id) || 0
      totalQuestionsCount += uCount

      const enrichedMacros = u.macro_topics.map(mt => {
        totalMacrosCount += 1
        const mtCount = macroCountMap.get(mt.macro_topic_id) || 0

        const enrichedMicros = mt.micro_topics.map(mct => {
          totalMicrosCount += 1
          const mctCount = microCountMap.get(mct.micro_topic_id) || 0
          return {
            ...mct,
            question_count: mctCount,
          }
        })

        return {
          ...mt,
          question_count: mtCount,
          micro_topics: enrichedMicros,
        }
      })

      return {
        ...u,
        question_count: uCount,
        macro_topics: enrichedMacros,
      }
    })

    return {
      group_id: hierarchy.group_id,
      group_name: hierarchy.group_name,
      units: enrichedUnits,
      totalUnits: enrichedUnits.length,
      totalMacros: totalMacrosCount,
      totalMicros: totalMicrosCount,
      totalQuestions: totalQuestionsCount,
    }
  },

  async getUnits(examId) {
    const { data, error } = await supabase
      .from('syllabus_units').select('*').eq('exam_id', examId).order('unit_number')
    if (error) throw error; return data ?? []
  },
  async upsertUnit(payload, id = null) {
    if (id) {
      const { data, error } = await supabase.from('syllabus_units').update(payload).eq('id', id).select().single()
      if (error) throw error; return data
    }
    const { data, error } = await supabase.from('syllabus_units').insert([payload]).select().single()
    if (error) throw error; return data
  },
  async deleteUnit(id) {
    const { error } = await supabase.from('syllabus_units').delete().eq('id', id)
    if (error) throw error
  },
  async getTopics(unitId) {
    const { data, error } = await supabase
      .from('syllabus_topics').select('*').eq('unit_id', unitId).order('topic_number')
    if (error) throw error; return data ?? []
  },
  async upsertTopic(payload, id = null) {
    if (id) {
      const { data, error } = await supabase.from('syllabus_topics').update(payload).eq('id', id).select().single()
      if (error) throw error; return data
    }
    const { data, error } = await supabase.from('syllabus_topics').insert([payload]).select().single()
    if (error) throw error; return data
  },
  async deleteTopic(id) {
    const { error } = await supabase.from('syllabus_topics').delete().eq('id', id)
    if (error) throw error
  },

  async upsertMicroTopic(payload, id = null) {
    try {
      if (id) {
        const { data, error } = await supabase.from('syllabus_micro_topics').update(payload).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase.from('syllabus_micro_topics').insert([payload]).select().single()
      if (error) throw error
      return data
    } catch (err) {
      console.warn('[adminSyllabusService] upsertMicroTopic error:', err.message)
      return { id: id || `micro-${Date.now()}`, ...payload }
    }
  },
  async deleteMicroTopic(id) {
    try {
      const { error } = await supabase.from('syllabus_micro_topics').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.warn('[adminSyllabusService] deleteMicroTopic error:', err.message)
    }
  },

  async autoCategorizeAllUploadedQuestions(examName = 'TNPSC Group 4') {
    const hierarchy = await syllabusAnalyticsService.buildHierarchy(examName)
    const allMicroTopics = hierarchy.units.flatMap(u =>
      u.macro_topics.flatMap(mt => mt.micro_topics)
    )

    let totalCategorized = 0

    // 1. Process questions table
    const { data: dbQuestions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, explanation, unit_name, macro_topic_name, micro_topic_name, tags')

    if (!qErr && dbQuestions && dbQuestions.length > 0) {
      for (const q of dbQuestions) {
        const match = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, allMicroTopics)
        if (match) {
          totalCategorized++
          // Attempt native column update
          const { error: updateErr } = await supabase
            .from('questions')
            .update({
              unit_name: match.unit_name,
              macro_topic_name: match.macro_topic_name,
              micro_topic_name: match.micro_topic_name,
              group_name: examName,
            })
            .eq('id', q.id)

          if (updateErr) {
            // Fallback: embed taxonomy in explanation
            const taxTag = `[Taxonomy: ${match.unit_name} > ${match.macro_topic_name} > ${match.micro_topic_name}]`
            const oldExpl = q.explanation || ''
            if (!oldExpl.includes('[Taxonomy:')) {
              await supabase
                .from('questions')
                .update({ explanation: `${taxTag}\n\n${oldExpl}`.trim() })
                .eq('id', q.id)
            }
          }
        }
      }
    }

    // 2. Process uploaded_papers table (BYOP & Admin PDF uploads)
    const { data: papers, error: pErr } = await supabase
      .from('uploaded_papers')
      .select('id, questions_json')

    let papersUpdated = 0
    if (!pErr && papers && papers.length > 0) {
      for (const p of papers) {
        let qList = []
        if (Array.isArray(p.questions_json)) qList = [...p.questions_json]
        else if (typeof p.questions_json === 'string' && p.questions_json.length > 2) {
          try { qList = JSON.parse(p.questions_json) } catch {}
        }

        if (qList.length > 0) {
          let modified = false
          qList = qList.map(q => {
            const match = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, allMicroTopics)
            if (match) {
              totalCategorized++
              modified = true
              return {
                ...q,
                unit_name: match.unit_name,
                macro_topic_name: match.macro_topic_name,
                micro_topic_name: match.micro_topic_name,
                tags: Array.from(new Set([...(q.tags || []), match.micro_topic_name, match.macro_topic_name, match.unit_name])),
              }
            }
            return q
          })

          if (modified) {
            await supabase
              .from('uploaded_papers')
              .update({ questions_json: qList })
              .eq('id', p.id)
            papersUpdated++
          }
        }
      }
    }

    return {
      success: true,
      totalCategorized,
      totalQuestions: (dbQuestions?.length || 0),
      papersUpdated,
    }
  },
}

// ─── Quick Recall admin ───────────────────────────────────────────────────────
export const adminRecallService = {
  async getAll(filters = {}) {
    let q = supabase.from('recall_questions').select('*').order('created_at', { ascending: false })
    if (filters.subject && filters.subject !== 'all') q = q.eq('subject', filters.subject)
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.search) q = q.ilike('question_text', `%${filters.search}%`)
    const { data, error } = await q
    if (error) throw error; return data ?? []
  },
  async upsert(payload, id = null) {
    if (id) {
      const { data, error } = await supabase
        .from('recall_questions').update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error; return data
    }
    const { data, error } = await supabase.from('recall_questions').insert([payload]).select().single()
    if (error) throw error; return data
  },
  async toggle(id, is_active) {
    const { data, error } = await supabase
      .from('recall_questions').update({ is_active }).eq('id', id).select().single()
    if (error) throw error; return data
  },
  async remove(id) {
    const { error } = await supabase.from('recall_questions').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── User management admin ────────────────────────────────────────────────────
export const adminUserService = {
  async getAll(filters = {}) {
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (filters.role && filters.role !== 'all') q = q.eq('role', filters.role)
    if (filters.search) {
      q = q.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    const { data, error } = await q
    if (error) throw error; return data ?? []
  },
  async getUserStats(userId) {
    const [attemptsRes, practiceRes, streakRes] = await Promise.allSettled([
      supabase.from('attempts').select('id,status,score,accuracy,submitted_at')
        .eq('user_id', userId).order('submitted_at', { ascending: false }).limit(10),
      supabase.from('practice_sessions').select('id,status').eq('user_id', userId),
      supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle(),
    ])
    return {
      attempts: attemptsRes.status === 'fulfilled' ? attemptsRes.value.data ?? [] : [],
      practice: practiceRes.status === 'fulfilled' ? practiceRes.value.data ?? [] : [],
      streak:   streakRes.status   === 'fulfilled' ? streakRes.value.data        : null,
    }
  },
  async setRole(userId, role) {
    const { data, error } = await supabase
      .from('profiles').update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId).select().single()
    if (error) throw error; return data
  },
}

// ─── Platform analytics ───────────────────────────────────────────────────────
export const adminAnalyticsService = {
  async get() {
    const [attRes, qRes, userRes] = await Promise.allSettled([
      supabase.from('attempts')
        .select('id,status,score,accuracy,correct_count,incorrect_count,unanswered_count,submitted_at,papers(subject,exam_name)')
        .eq('status','completed').order('submitted_at',{ascending:false}).limit(200),
      supabase.from('questions').select('id,paper_id,correct_option'),
      supabase.from('profiles').select('id,role,created_at'),
    ])

    const attempts = attRes.status === 'fulfilled' ? attRes.value.data ?? [] : []
    const users    = userRes.status === 'fulfilled' ? userRes.value.data ?? [] : []

    if (!attempts.length) return { hasData: false, totalUsers: users.length }

    const totalAttempts   = attempts.length
    const totalCorrect    = attempts.reduce((s, a) => s + (a.correct_count   ?? 0), 0)
    const totalWrong      = attempts.reduce((s, a) => s + (a.incorrect_count ?? 0), 0)
    const totalSkipped    = attempts.reduce((s, a) => s + (a.unanswered_count ?? 0), 0)
    const avgScore        = (attempts.reduce((s, a) => s + Number(a.score    ?? 0), 0) / totalAttempts).toFixed(1)
    const avgAccuracy     = (attempts.reduce((s, a) => s + Number(a.accuracy ?? 0), 0) / totalAttempts).toFixed(1)

    // Subject breakdown
    const subjMap = {}
    attempts.forEach(a => {
      const s = a.papers?.subject ?? 'General'
      if (!subjMap[s]) subjMap[s] = { correct: 0, wrong: 0, total: 0 }
      subjMap[s].correct += a.correct_count   ?? 0
      subjMap[s].wrong   += a.incorrect_count ?? 0
      subjMap[s].total   += (a.correct_count + a.incorrect_count + a.unanswered_count)
    })
    const subjects = Object.entries(subjMap).map(([subject, v]) => ({
      subject,
      attempts: v.total,
      accuracy: v.total ? ((v.correct / v.total) * 100).toFixed(1) : '0',
    })).sort((a, b) => Number(b.accuracy) - Number(a.accuracy))

    // Daily trend (last 14 days)
    const dayMap = {}
    attempts.slice(0, 100).forEach(a => {
      if (!a.submitted_at) return
      const d = a.submitted_at.slice(0, 10)
      if (!dayMap[d]) dayMap[d] = { count: 0, accSum: 0 }
      dayMap[d].count++
      dayMap[d].accSum += Number(a.accuracy ?? 0)
    })
    const trend = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({
        date,
        attempts: v.count,
        accuracy: (v.accSum / v.count).toFixed(1),
      }))

    const week = new Date(); week.setDate(week.getDate() - 7)
    return {
      hasData: true,
      totalUsers: users.filter(u => u.role !== 'admin').length,
      newUsersWeek: users.filter(u => new Date(u.created_at) >= week).length,
      totalAttempts,
      totalCorrect,
      totalWrong,
      totalSkipped,
      avgScore,
      avgAccuracy,
      subjects,
      trend,
    }
  },
}
