const FALLBACK_RECALL_POOL = [
  {
    id: 'fb-recall-1',
    question_text: 'Which Article of the Indian Constitution provides for the establishment of the Finance Commission?',
    option_a: 'Article 280',
    option_b: 'Article 260',
    option_c: 'Article 324',
    option_d: 'Article 352',
    correct_option: 'A',
  },
  {
    id: 'fb-recall-2',
    question_text: 'Which Chola ruler constructed the famous Brihadisvara Temple in Thanjavur?',
    option_a: 'Rajendra Chola I',
    option_b: 'Rajaraja Chola I',
    option_c: 'Parantaka Chola I',
    option_d: 'Kulothunga Chola I',
    correct_option: 'B',
  },
  {
    id: 'fb-recall-3',
    question_text: 'The fundamental duties of Indian citizens were incorporated in the Constitution upon the recommendation of:',
    option_a: 'Sarkaria Commission',
    option_b: 'Balwant Rai Mehta Committee',
    option_c: 'Swaran Singh Committee',
    option_d: 'Verma Committee',
    correct_option: 'C',
  },
  {
    id: 'fb-recall-4',
    question_text: 'Who among the following was the founder of the Khudai Khidmatgar (Red Shirts) movement?',
    option_a: 'Maulana Abul Kalam Azad',
    option_b: 'Khan Abdul Ghaffar Khan',
    option_c: 'Syed Ahmed Khan',
    option_d: 'Muhammad Ali Jinnah',
    correct_option: 'B',
  },
  {
    id: 'fb-recall-5',
    question_text: 'Which planet in our solar system has the highest density?',
    option_a: 'Mercury',
    option_b: 'Venus',
    option_c: 'Jupiter',
    option_d: 'Earth',
    correct_option: 'D',
  },
  {
    id: 'fb-recall-6',
    question_text: 'The Tropic of Cancer does NOT pass through which of the following Indian states?',
    option_a: 'Rajasthan',
    option_b: 'Odisha',
    option_c: 'Chhattisgarh',
    option_d: 'Tripura',
    correct_option: 'B',
  },
]

/**
 * TNPSC Feature Services
 * All Supabase queries for TNPSC-specific features.
 */
import { supabase } from '../lib/supabase'

// ─── Current Affairs ────────────────────────────────────────────────────────
export const currentAffairsService = {
  async getAll(filters = {}) {
    let q = supabase
      .from('current_affairs')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false })

    if (filters.category && filters.category !== 'all') {
      q = q.eq('category', filters.category)
    }
    if (filters.language) {
      q = q.eq('language', filters.language)
    }
    if (filters.search) {
      q = q.ilike('title', `%${filters.search}%`)
    }
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('current_affairs').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('current_affairs').insert([payload]).select().single()
    if (error) throw error
    return data
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('current_affairs')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ─── Government Notifications ────────────────────────────────────────────────
export const govtNotificationService = {
  async getAll(filters = {}) {
    let q = supabase
      .from('government_notifications')
      .select('*')
      .order('published_at', { ascending: false })

    if (filters.department && filters.department !== 'all') {
      q = q.eq('department', filters.department)
    }
    if (filters.status && filters.status !== 'all') {
      q = q.eq('status', filters.status)
    }
    if (filters.search) {
      q = q.ilike('title', `%${filters.search}%`)
    }
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('government_notifications').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('government_notifications').insert([payload]).select().single()
    if (error) throw error
    return data
  },
}

// ─── Syllabus ────────────────────────────────────────────────────────────────
export const syllabusService = {
  async getExams() {
    const { data, error } = await supabase.from('syllabus_exams').select('*')
    if (error) throw error
    return data ?? []
  },

  async getUnitsWithTopics(examName) {
    const { data: exam } = await supabase
      .from('syllabus_exams').select('id').eq('exam_name', examName).maybeSingle()
    if (!exam) return []

    const { data: units, error } = await supabase
      .from('syllabus_units')
      .select('*, syllabus_topics(*)')
      .eq('exam_id', exam.id)
      .order('unit_number')
    if (error) throw error
    return units ?? []
  },

  async getUserProgress(userId) {
    const { data, error } = await supabase
      .from('user_syllabus_progress')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    // Return as map: { topic_id -> progress }
    return Object.fromEntries((data ?? []).map(p => [p.topic_id, p]))
  },

  async upsertProgress(userId, topicId, status, score) {
    const { data, error } = await supabase
      .from('user_syllabus_progress')
      .upsert({ user_id: userId, topic_id: topicId, status, score, updated_at: new Date().toISOString() },
               { onConflict: 'user_id,topic_id' })
      .select().single()
    if (error) throw error
    return data
  },
}

// ─── Quick Recall ────────────────────────────────────────────────────────────
export const quickRecallService = {
  /** Fetch 5 questions from the recall_questions table, fall back to questions table or built-in high-yield pool. */
  async fetchRecallQuestions(examContext) {
    let pool = []
    try {
      const { data: pool1 } = await supabase
        .from('recall_questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, correct_option')
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(50)
      if (pool1) pool = [...pool1]
    } catch (e) {
      console.warn('Error fetching recall_questions:', e)
    }

    if (pool.length < 5) {
      try {
        const { data: pool2 } = await supabase
          .from('questions')
          .select('id, question_text, option_a, option_b, option_c, option_d, correct_option')
          .not('correct_option', 'is', null)
          .limit(50)
        if (pool2) pool = [...pool, ...pool2]
      } catch (e) {
        console.warn('Error fetching questions fallback:', e)
      }
    }

    // If still under 5, add high-yield fallback questions
    if (pool.length < 5) {
      pool = [...pool, ...FALLBACK_RECALL_POOL]
    }

    // Fisher-Yates shuffle and take 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 5)
  },

  async createSession(userId, examContext, questionsSnapshot) {
    try {
      const { data, error } = await supabase
        .from('quick_recall_sessions')
        .insert([{
          user_id: userId,
          exam_context: examContext,
          questions_json: questionsSnapshot,
          started_at: new Date().toISOString(),
        }])
        .select().single()
      if (error) throw error
      return data
    } catch (e) {
      console.warn('Using local quick recall session:', e.message)
      return { id: `session-${Date.now()}` }
    }
  },

  async saveAnswer(sessionId, index, questionText, selected, correct, isCorrect) {
    if (sessionId?.startsWith?.('session-')) return { id: `ans-${Date.now()}` }
    try {
      const { data, error } = await supabase
        .from('quick_recall_answers')
        .insert([{
          session_id: sessionId,
          question_index: index,
          question_text: questionText,
          selected_answer: selected,
          correct_answer: correct,
          is_correct: isCorrect,
        }])
        .select().single()
      if (error) console.warn('Error saving recall answer:', error.message)
      return data || {}
    } catch (e) {
      return {}
    }
  },

  async finaliseSession(userId, correctCount, totalCount, sessionId) {
    try {
      const { data, error } = await supabase.rpc('update_streak_after_recall', {
        p_user_id:       userId,
        p_correct_count: correctCount,
        p_total_count:   totalCount,
        p_session_id:    sessionId?.startsWith?.('session-') ? null : sessionId,
      })
      if (!error && data) return data
    } catch (e) {
      console.warn('update_streak_after_recall RPC fallback:', e.message)
    }

    // Direct fallback to user_streaks table
    const pointsEarned = correctCount * 10
    try {
      const { data: currentStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      const newStreak = (currentStreak?.current_streak || 0) + (correctCount >= 3 ? 1 : 0)
      const maxStreak = Math.max(newStreak, currentStreak?.longest_streak || 0)
      const totalPoints = (currentStreak?.recall_points || 0) + pointsEarned

      await supabase.from('user_streaks').upsert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: maxStreak,
        recall_points: totalPoints,
        last_active_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      return {
        new_streak: newStreak,
        recall_points: totalPoints,
        points_earned: pointsEarned,
      }
    } catch (err) {
      return {
        new_streak: correctCount,
        recall_points: pointsEarned,
        points_earned: pointsEarned,
      }
    }
  },
}

// ─── Practice Sessions ────────────────────────────────────────────────────────
export const practiceService = {
  async createSession(userId, config) {
    let paperIds = []
    if (config.exam_context) {
      const { data: examPapers } = await supabase
        .from('papers')
        .select('id')
        .eq('status', 'published')
        .eq('exam_name', config.exam_context)

      paperIds = (examPapers ?? []).map(p => p.id)
    }

    let q = supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_option')
      .not('correct_option', 'is', null)

    if (paperIds.length > 0) {
      q = q.in('paper_id', paperIds)
    }

    const { data: pool, error: poolErr } = await q.limit(200)
    if (poolErr) throw poolErr
    if (!pool || pool.length === 0) {
      throw new Error(
        paperIds.length > 0
          ? `No questions found for ${config.exam_context}. Ask admin to publish papers for this exam.`
          : 'No questions available. Please ask admin to publish papers.'
      )
    }

    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const count = Math.min(config.question_count, shuffled.length)
    const selected = shuffled.slice(0, count)

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert([{
        user_id:        userId,
        exam_context:   config.exam_context,
        subject:        config.subject,
        question_count: count,
        timer_mode:     config.timer_mode,
        difficulty:     config.difficulty,
        status:         'created',
        questions_json: selected.map(q => ({ id: q.id, correct_option: q.correct_option })),
        started_at:     new Date().toISOString(),
      }])
      .select().single()
    if (error) throw error

    return { session: data, questions: selected }
  },

  async getSession(sessionId) {
    const { data, error } = await supabase
      .from('practice_sessions').select('*').eq('id', sessionId).single()
    if (error) throw error
    return data
  },

  async updateSession(sessionId, updates) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .update({ ...updates })
      .eq('id', sessionId).select().single()
    if (error) throw error
    return data
  },

  async getHistory(userId) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },
}

// ─── User Notes ───────────────────────────────────────────────────────────────
export const notesService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async create(userId, payload) {
    const { data, error } = await supabase
      .from('user_notes')
      .insert([{ user_id: userId, ...payload }])
      .select().single()
    if (error) throw error
    return data
  },

  async update(id, userId, payload) {
    const { data, error } = await supabase
      .from('user_notes')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId)
      .select().single()
    if (error) throw error
    return data
  },

  async remove(id, userId) {
    const { error } = await supabase
      .from('user_notes').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  },
}

// ─── Uploaded Papers (BYOP) ───────────────────────────────────────────────────
export const byopService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('uploaded_papers').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async create(userId, payload) {
    const { data, error } = await supabase
      .from('uploaded_papers')
      .insert([{ user_id: userId, ...payload }])
      .select().single()
    if (error) throw error
    return data
  },

  async update(id, userId, payload) {
    console.log('[byopService] PATCH REQUEST:', {
      id,
      userId,
      fieldNames: Object.keys(payload),
      fieldTypes: Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [
          k,
          Array.isArray(v) ? `array[${v.length}]` : typeof v
        ])
      )
    })
    
    const { data, error } = await supabase
      .from('uploaded_papers')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId)
      .select().single()
    
    if (error) {
      console.error('[byopService] SUPABASE PATCH ERROR:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        statusCode: error?.statusCode,
        statusText: error?.statusText
      })
      throw error
    }
    
    console.log('[byopService] PATCH SUCCESS:', { id })
    return data
  },

  async uploadFile(userId, file) {
    const ext  = file.name.split('.').pop()
    const path = `byop/${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('user-papers')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    return { path: data.path }
  },

  async getSignedUrl(storagePath) {
    const { data, error } = await supabase.storage
      .from('user-papers')
      .createSignedUrl(storagePath, 3600)
    if (error) throw error
    return data.signedUrl
  },
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsService = {
  /** Compute analytics from completed attempts, optionally filtered by exam. */
  async getOverview(userId, examName = null) {
    let q = supabase
      .from('attempts')
      .select('*, papers(title, subject, exam_name), attempt_answers(*, questions(question_text, correct_option))')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false })
      .limit(50)

    const { data: attempts, error } = await q
    if (error) throw error

    // Filter client-side by exam name so we don't lose the joined data
    const list = (attempts ?? []).filter(a =>
      !examName || a.papers?.exam_name === examName
    )

    if (list.length === 0) return { hasData: false }

    const totalAttempts  = list.length
    const totalQuestions = list.reduce((s, a) => s + (a.correct_count + a.incorrect_count + a.unanswered_count), 0)
    const totalCorrect   = list.reduce((s, a) => s + (a.correct_count   ?? 0), 0)
    const totalWrong     = list.reduce((s, a) => s + (a.incorrect_count ?? 0), 0)
    const totalSkipped   = list.reduce((s, a) => s + (a.unanswered_count ?? 0), 0)
    const avgScore       = list.reduce((s, a) => s + Number(a.score     ?? 0), 0) / totalAttempts
    const avgAccuracy    = list.reduce((s, a) => s + Number(a.accuracy  ?? 0), 0) / totalAttempts

    // Subject breakdown
    const subjectMap = {}
    list.forEach(a => {
      const subj = a.papers?.subject ?? 'General'
      if (!subjectMap[subj]) subjectMap[subj] = { correct: 0, total: 0, count: 0 }
      subjectMap[subj].correct += a.correct_count ?? 0
      subjectMap[subj].total   += (a.correct_count + a.incorrect_count + a.unanswered_count)
      subjectMap[subj].count   += 1
    })
    const subjectBreakdown = Object.entries(subjectMap).map(([subject, v]) => ({
      subject,
      accuracy:  v.total ? ((v.correct / v.total) * 100).toFixed(1) : '0',
      attempted: v.total,
      correct:   v.correct,
      count:     v.count,
    }))

    // Recent trend (last 8 attempts)
    const trend = list.slice(0, 8).reverse().map((a, i) => ({
      attempt: i + 1,
      score:    Number(a.score    ?? 0).toFixed(1),
      accuracy: Number(a.accuracy ?? 0).toFixed(1),
      date:     a.submitted_at,
    }))

    return {
      hasData: true,
      totalAttempts,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalSkipped,
      avgScore:    avgScore.toFixed(2),
      avgAccuracy: avgAccuracy.toFixed(1),
      subjectBreakdown,
      trend,
      recentAttempts: list.slice(0, 5),
    }
  },
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileService = {
  async update(userId, payload) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select().single()
    if (error) throw error
    return data
  },
}
