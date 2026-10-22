/**
 * User Question History & Zero-Repetition Service
 * 
 * Implements:
 * 1. Zero-Repetition Tracking: Ensures Mock Test 2 never repeats questions from Mock Test 1.
 * 2. Remote Supabase user_question_history persistence with seamless local offline fallback.
 * 3. Smart Reshuffling: When question pool is exhausted, prioritizes unseen questions first,
 *    then draws from least-seen questions (ORDER BY times_seen ASC, RANDOM()).
 * 4. Records question exposure on exam submission.
 */

import { supabase } from '../lib/supabase.js'

const LOCAL_STORAGE_PREFIX = 'user_q_hist_'

export const questionHistoryService = {
  /**
   * Retrieves all question IDs seen by this user for a given exam tag
   * Returns a Map of questionId -> { times_seen, last_attempt_status, last_seen_at }
   */
  async getUserQuestionHistory(userId, examTag = 'TNPSC_GROUP_1') {
    if (!userId) return new Map()

    const historyMap = new Map()

    // 1. Try fetching from Supabase table
    try {
      const { data, error } = await supabase
        .from('user_question_history')
        .select('question_id, times_seen, last_attempt_status, last_seen_at')
        .eq('user_id', userId)
        .eq('exam_tag', examTag)

      if (!error && Array.isArray(data)) {
        data.forEach(row => {
          historyMap.set(String(row.question_id), {
            times_seen: Number(row.times_seen || 1),
            last_attempt_status: row.last_attempt_status || 'ATTEMPTED',
            last_seen_at: row.last_seen_at || new Date().toISOString(),
          })
        })
        return historyMap
      }
    } catch (e) {
      // Table may not exist or network unavailable -> proceed to local storage
    }

    // 2. LocalStorage Fallback
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${userId}_${examTag}`
      const localStr = localStorage.getItem(key)
      if (localStr) {
        const parsed = JSON.parse(localStr)
        Object.entries(parsed).forEach(([qId, val]) => {
          historyMap.set(String(qId), val)
        })
      }
    } catch (e) {
      console.warn('[questionHistoryService] LocalStorage read note:', e)
    }

    return historyMap
  },

  /**
   * Filters a candidate question pool into:
   * - unseen: questions not yet in user's history
   * - seen: questions ordered by times_seen ascending
   */
  async partitionPoolByHistory(userId, examTag, questionsPool) {
    const historyMap = await this.getUserQuestionHistory(userId, examTag)

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

  /**
   * Records that the user has completed/seen these questions
   * Updates times_seen, last_attempt_status, and last_seen_at
   */
  async recordQuestionsSeen(userId, examTag, questionResults = []) {
    if (!userId || !questionResults.length) return

    const now = new Date().toISOString()
    const upsertRows = questionResults.map(r => ({
      user_id: userId,
      question_id: String(r.question_id || r.id),
      exam_tag: examTag,
      times_seen: 1, // handled in DB trigger or incremented locally
      last_attempt_status: r.is_correct === true ? 'CORRECT' : r.is_correct === false ? 'INCORRECT' : 'UNATTEMPTED',
      last_seen_at: now,
    }))

    // 1. Update Supabase table if possible
    try {
      // Fetch existing counts for increment
      const qIds = upsertRows.map(r => r.question_id)
      const { data: existing } = await supabase
        .from('user_question_history')
        .select('question_id, times_seen')
        .eq('user_id', userId)
        .in('question_id', qIds)

      const existingMap = new Map((existing || []).map(e => [e.question_id, e.times_seen]))

      const finalRows = upsertRows.map(r => ({
        ...r,
        times_seen: (existingMap.get(r.question_id) || 0) + 1,
      }))

      await supabase
        .from('user_question_history')
        .upsert(finalRows, { onConflict: 'user_id,question_id' })
    } catch (e) {
      // Table may not exist yet in DB
    }

    // 2. Always maintain local cache in LocalStorage
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${userId}_${examTag}`
      const localStr = localStorage.getItem(key)
      const store = localStr ? JSON.parse(localStr) : {}

      questionResults.forEach(r => {
        const qId = String(r.question_id || r.id)
        const prev = store[qId] || { times_seen: 0 }
        store[qId] = {
          times_seen: prev.times_seen + 1,
          last_attempt_status: r.is_correct === true ? 'CORRECT' : r.is_correct === false ? 'INCORRECT' : 'UNATTEMPTED',
          last_seen_at: now,
        }
      })

      localStorage.setItem(key, JSON.stringify(store))
    } catch (e) {
      console.warn('[questionHistoryService] LocalStorage write note:', e)
    }
  },
}
