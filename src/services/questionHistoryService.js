/**
 * User Question History & Dual-Track Zero-Repetition Service
 * 
 * Implements:
 * 1. Mock Test Non-Repetition:
 *    - Tracks questions seen in Mock Tests via `user_mock_question_history (user_id, question_id)`.
 *    - Zero repetition across Mock Tests (Mock 1 != Mock 2 != Mock 3).
 *    - Only reshuffles after 100% of the questions in the group are exhausted.
 * 2. Quick Recall Non-Repetition:
 *    - Dedicated pool tracked via `user_quick_recall_history (user_id, question_id)`.
 *    - User never receives repeated questions across daily Quick Recall sessions.
 * 3. Cross-Pool Independence:
 *    - Mock Test history and Quick Recall history are 100% independent.
 *    - A question seen in Quick Recall CAN appear in Full Mock Tests and vice-versa.
 * 4. Resilient Fallbacks:
 *    - Seamlessly falls back to attempt_answers / quick_recall_answers + persistent localStorage
 *      if database migration tables are pending in remote instance.
 */

import { supabase } from '../lib/supabase.js'

export const questionHistoryService = {
  // ─── 1. MOCK TEST NON-REPETITION TRACKING ───────────────────────────────────

  /**
   * Retrieves all mock question IDs seen by this user for a given exam tag
   * Returns a Map of questionId -> { times_seen, last_attempt_status, last_seen_at }
   */
  async getMockQuestionHistory(userId, examTag = 'TNPSC_GROUP_4') {
    if (!userId) return new Map()

    const historyMap = new Map()

    // 1. Try remote user_mock_question_history table
    let fetchedFromDb = false
    try {
      const { data, error } = await supabase
        .from('user_mock_question_history')
        .select('question_id, times_seen, last_attempt_status, last_seen_at')
        .eq('user_id', userId)

      if (!error && Array.isArray(data)) {
        data.forEach(row => {
          if (row.question_id) {
            historyMap.set(String(row.question_id), {
              times_seen: Number(row.times_seen || 1),
              last_attempt_status: row.last_attempt_status || 'ATTEMPTED',
              last_seen_at: row.last_seen_at || new Date().toISOString(),
            })
          }
        })
        fetchedFromDb = true
      }
    } catch (e) {
      // Table may not exist yet in schema cache
    }

    // 2. Fallback: try legacy user_question_history if user_mock_question_history was absent
    if (!fetchedFromDb) {
      try {
        const { data, error } = await supabase
          .from('user_question_history')
          .select('question_id, times_seen, last_attempt_status, last_seen_at')
          .eq('user_id', userId)

        if (!error && Array.isArray(data)) {
          data.forEach(row => {
            if (row.question_id) {
              historyMap.set(String(row.question_id), {
                times_seen: Number(row.times_seen || 1),
                last_attempt_status: row.last_attempt_status || 'ATTEMPTED',
                last_seen_at: row.last_seen_at || new Date().toISOString(),
              })
            }
          })
          fetchedFromDb = true
        }
      } catch (e) {}
    }

    // 3. Fallback: query previous attempt_answers for this user's mock attempts
    if (!fetchedFromDb) {
      try {
        const { data: userAttempts } = await supabase
          .from('attempts')
          .select('id')
          .eq('user_id', userId)
          .limit(100)

        if (userAttempts && userAttempts.length > 0) {
          const attemptIds = userAttempts.map(a => a.id)
          const { data: pastAnswers } = await supabase
            .from('attempt_answers')
            .select('question_id, is_correct')
            .in('attempt_id', attemptIds)

          if (pastAnswers && Array.isArray(pastAnswers)) {
            pastAnswers.forEach(ans => {
              if (ans.question_id) {
                const qId = String(ans.question_id)
                const current = historyMap.get(qId) || { times_seen: 0 }
                historyMap.set(qId, {
                  times_seen: current.times_seen + 1,
                  last_attempt_status: ans.is_correct ? 'CORRECT' : 'INCORRECT',
                  last_seen_at: new Date().toISOString(),
                })
              }
            })
          }
        }
      } catch (e) {}
    }

    // 4. Merge persistent client localStorage mirror
    try {
      const localRaw = localStorage.getItem(`vina_mock_history_${userId}`)
      if (localRaw) {
        const localData = JSON.parse(localRaw)
        Object.entries(localData).forEach(([qId, item]) => {
          if (!historyMap.has(qId)) {
            historyMap.set(qId, item)
          }
        })
      }
    } catch (e) {}

    return historyMap
  },

  /**
   * Partitions candidate mock questions into:
   * - unseen: questions never seen in user's mock history
   * - seen: questions ordered by times_seen ascending
   */
  async partitionMockPoolByHistory(userId, examTag, questionsPool) {
    const historyMap = await this.getMockQuestionHistory(userId, examTag)

    const unseen = []
    const seen = []

    questionsPool.forEach(q => {
      const qId = String(q.id || q.question_id)
      const hist = historyMap.get(qId)
      if (!hist) {
        unseen.push(q)
      } else {
        seen.push({
          ...q,
          times_seen: hist.times_seen,
          last_attempt_status: hist.last_attempt_status,
          last_seen_at: hist.last_seen_at,
        })
      }
    })

    // Sort seen pool by times_seen ASC, then by randomized order
    seen.sort((a, b) => {
      if (a.times_seen !== b.times_seen) return a.times_seen - b.times_seen
      return 0.5 - Math.random()
    })

    return { unseen, seen, historyMap }
  },

  /**
   * Records that the user has seen/attended these questions in a Mock Test
   */
  async recordMockQuestionsSeen(userId, examTag, questionResults = []) {
    if (!userId || !questionResults.length) return

    const now = new Date().toISOString()
    const qIds = questionResults.map(r => String(r.question_id || r.id))

    // 1. Sync local storage mirror
    try {
      const localKey = `vina_mock_history_${userId}`
      const existingStr = localStorage.getItem(localKey)
      const existing = existingStr ? JSON.parse(existingStr) : {}
      qIds.forEach(id => {
        existing[id] = {
          times_seen: (existing[id]?.times_seen || 0) + 1,
          last_seen_at: now,
          exam_tag: examTag,
        }
      })
      localStorage.setItem(localKey, JSON.stringify(existing))
    } catch (e) {}

    // 2. Try remote database persistence
    const upsertRows = questionResults.map(r => ({
      user_id: userId,
      question_id: String(r.question_id || r.id),
      exam_tag: examTag,
      times_seen: 1,
      last_attempt_status: r.is_correct === true ? 'CORRECT' : r.is_correct === false ? 'INCORRECT' : 'ATTEMPTED',
      last_seen_at: now,
    }))

    try {
      // Try user_mock_question_history table
      const { data: existingRows } = await supabase
        .from('user_mock_question_history')
        .select('question_id, times_seen')
        .eq('user_id', userId)
        .in('question_id', qIds)

      const existingMap = new Map((existingRows || []).map(e => [String(e.question_id), e.times_seen]))
      const finalRows = upsertRows.map(r => ({
        ...r,
        times_seen: (existingMap.get(r.question_id) || 0) + 1,
      }))

      const { error } = await supabase
        .from('user_mock_question_history')
        .upsert(finalRows, { onConflict: 'user_id,question_id' })

      if (!error) return
    } catch (e) {}

    // Fallback try user_question_history
    try {
      await supabase
        .from('user_question_history')
        .upsert(upsertRows, { onConflict: 'user_id,question_id' })
    } catch (e) {}
  },

  // ─── 2. QUICK RECALL NON-REPETITION TRACKING ────────────────────────────────

  /**
   * Retrieves all Quick Recall question IDs seen by this user
   * Returns a Map of questionId -> { times_seen, last_seen_at }
   */
  async getQuickRecallHistory(userId, examTag = 'TNPSC_GROUP_4') {
    if (!userId) return new Map()

    const historyMap = new Map()
    let fetchedFromDb = false

    // 1. Try remote user_quick_recall_history table
    try {
      const { data, error } = await supabase
        .from('user_quick_recall_history')
        .select('question_id, times_seen, last_attempt_status, last_seen_at')
        .eq('user_id', userId)

      if (!error && Array.isArray(data)) {
        data.forEach(row => {
          if (row.question_id) {
            historyMap.set(String(row.question_id), {
              times_seen: Number(row.times_seen || 1),
              last_seen_at: row.last_seen_at || new Date().toISOString(),
            })
          }
        })
        fetchedFromDb = true
      }
    } catch (e) {}

    // 2. Fallback: try quick_recall_answers table
    if (!fetchedFromDb) {
      try {
        const { data: pastAnswers } = await supabase
          .from('quick_recall_answers')
          .select('question_text, is_correct, answered_at')
          .limit(200)

        if (pastAnswers && Array.isArray(pastAnswers)) {
          pastAnswers.forEach(ans => {
            const key = (ans.question_text || '').trim().toLowerCase()
            if (key) {
              const current = historyMap.get(key) || { times_seen: 0 }
              historyMap.set(key, {
                times_seen: current.times_seen + 1,
                last_seen_at: ans.answered_at || new Date().toISOString(),
              })
            }
          })
        }
      } catch (e) {}
    }

    // 3. Merge persistent client localStorage mirror
    try {
      const localRaw = localStorage.getItem(`vina_recall_history_${userId}`)
      if (localRaw) {
        const localData = JSON.parse(localRaw)
        Object.entries(localData).forEach(([qId, item]) => {
          if (!historyMap.has(qId)) {
            historyMap.set(qId, item)
          }
        })
      }
    } catch (e) {}

    return historyMap
  },

  /**
   * Partitions candidate quick recall questions into:
   * - unseen: questions never seen in user's Quick Recall history
   * - seen: questions ordered by times_seen ascending
   */
  async partitionQuickRecallPoolByHistory(userId, examTag, questionsPool) {
    const historyMap = await this.getQuickRecallHistory(userId, examTag)

    const unseen = []
    const seen = []

    questionsPool.forEach(q => {
      const qId = String(q.id || q.question_id)
      const textKey = (q.question_text || q.en_question_text || '').trim().toLowerCase()
      const hist = historyMap.get(qId) || (textKey ? historyMap.get(textKey) : null)

      if (!hist) {
        unseen.push(q)
      } else {
        seen.push({
          ...q,
          times_seen: hist.times_seen,
          last_seen_at: hist.last_seen_at,
        })
      }
    })

    // Sort seen pool by times_seen ASC, then by randomized order
    seen.sort((a, b) => {
      if (a.times_seen !== b.times_seen) return a.times_seen - b.times_seen
      return 0.5 - Math.random()
    })

    return { unseen, seen, historyMap }
  },

  /**
   * Records that the user has completed/seen these questions in Quick Recall
   */
  async recordQuickRecallQuestionsSeen(userId, examTag, questions = []) {
    if (!userId || !questions.length) return

    const now = new Date().toISOString()
    const qIds = questions.map(r => String(r.id || r.question_id || ''))

    // 1. Sync local storage mirror
    try {
      const localKey = `vina_recall_history_${userId}`
      const existingStr = localStorage.getItem(localKey)
      const existing = existingStr ? JSON.parse(existingStr) : {}
      questions.forEach(q => {
        const id = String(q.id || q.question_id)
        const textKey = (q.question_text || q.en_question_text || '').trim().toLowerCase()
        existing[id] = {
          times_seen: (existing[id]?.times_seen || 0) + 1,
          last_seen_at: now,
          exam_tag: examTag,
        }
        if (textKey) {
          existing[textKey] = existing[id]
        }
      })
      localStorage.setItem(localKey, JSON.stringify(existing))
    } catch (e) {}

    // 2. Try remote database persistence
    const upsertRows = questions
      .filter(q => q.id || q.question_id)
      .map(q => ({
        user_id: userId,
        question_id: String(q.id || q.question_id),
        exam_tag: examTag,
        times_seen: 1,
        last_attempt_status: 'ATTEMPTED',
        last_seen_at: now,
      }))

    if (!upsertRows.length) return

    try {
      const { data: existingRows } = await supabase
        .from('user_quick_recall_history')
        .select('question_id, times_seen')
        .eq('user_id', userId)
        .in('question_id', qIds)

      const existingMap = new Map((existingRows || []).map(e => [String(e.question_id), e.times_seen]))
      const finalRows = upsertRows.map(r => ({
        ...r,
        times_seen: (existingMap.get(r.question_id) || 0) + 1,
      }))

      await supabase
        .from('user_quick_recall_history')
        .upsert(finalRows, { onConflict: 'user_id,question_id' })
    } catch (e) {}
  },

  // ─── 3. SAMPLING UTILITY ─────────────────────────────────────────────────────

  /**
   * Smart Sample Quota: Pulls exact targetCount questions
   * Prioritizes unseen questions first.
   * If insufficient, fills remainder from least-seen questions.
   */
  sampleFreshQuestions(unseenPool, seenPool, targetCount) {
    const shuffledUnseen = [...unseenPool].sort(() => 0.5 - Math.random())

    if (shuffledUnseen.length >= targetCount) {
      return shuffledUnseen.slice(0, targetCount)
    }

    // Unseen pool is smaller than quota -> pull all unseen + deficit from least-seen
    const selected = [...shuffledUnseen]
    const deficit = targetCount - selected.length
    const sortedSeen = [...seenPool].sort((a, b) => (a.times_seen || 1) - (b.times_seen || 1))

    for (let i = 0; i < deficit && i < sortedSeen.length; i++) {
      selected.push(sortedSeen[i])
    }

    return selected
  },

  // ─── 4. BACKWARD COMPATIBILITY ALIASES ───────────────────────────────────────
  async getUserQuestionHistory(userId, examTag) {
    return this.getMockQuestionHistory(userId, examTag)
  },

  async partitionPoolByHistory(userId, examTag, questionsPool) {
    return this.partitionMockPoolByHistory(userId, examTag, questionsPool)
  },

  async recordQuestionsSeen(userId, examTag, questionResults) {
    return this.recordMockQuestionsSeen(userId, examTag, questionResults)
  },
}
