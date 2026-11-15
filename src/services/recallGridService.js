import { supabase } from '../lib/supabase'

// Data access for the Quick Recall admin grid. It mirrors the question bank's
// grid service, but reads and writes the common recall_questions pool (one pool
// for every exam group). Needs migration 00018_recall_questions_29_columns.sql.

const MIGRATION_HINT = 'Run migration 00018_recall_questions_29_columns.sql in the Supabase SQL Editor first.'

function explain(error) {
  if (error?.code === '42703' || /column .* does not exist/i.test(String(error?.message || ''))) {
    return new Error(MIGRATION_HINT)
  }
  return error
}

// PostgREST filter syntax uses commas and parentheses, so strip them from user text.
const cleanTerm = (value) => String(value || '').trim().replace(/[,()%*\\]/g, ' ').trim()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Older rows kept their metadata in tags such as "unit_code:UNIT_I".
function tagValue(row, prefix) {
  const tag = (row.tags || []).find(t => typeof t === 'string' && t.startsWith(prefix))
  return tag ? tag.slice(prefix.length) : ''
}

// Shapes a recall_questions row so normalizeTo29Columns() can read it.
function toGridRow(row) {
  return {
    ...row,
    question_text_tamil: row.question_ta || '',
    exam_tag: row.exam_tag || tagValue(row, 'exam_tag:') || row.exam_context || 'TNPSC_GROUP_4',
    unit_code: row.unit_code || tagValue(row, 'unit_code:') || '',
    macro_topic: row.macro_topic || tagValue(row, 'macro:') || row.topic || '',
    micro_topic: row.micro_topic || tagValue(row, 'micro:') || '',
    sub_topic: row.sub_topic || tagValue(row, 'sub:') || '',
    source_type: row.source_type || tagValue(row, 'source:') || 'VINA',
    year: row.year || Number.parseInt(tagValue(row, 'year:'), 10) || undefined,
    cognitive_skill: row.cognitive_skill || tagValue(row, 'cog:') || undefined,
    subject_name: row.subject_name || row.subject || undefined,
    difficulty_level: row.difficulty_level || (row.difficulty ? String(row.difficulty).toUpperCase() : undefined),
  }
}

// Grid field names (as saved by the bank grid) -> recall_questions columns.
function toRecallColumns(fields) {
  const out = {}
  Object.entries(fields).forEach(([key, value]) => {
    if (['unit_tag', 'macro_topic_name', 'micro_topic_name', 'is_pyq', 'exam_year'].includes(key)) return
    if (key === 'question_text_tamil') { out.question_ta = value; return }
    out[key] = value
    // The legacy lower-case difficulty column has a CHECK constraint; keep it in step.
    if (key === 'difficulty_level') out.difficulty = String(value).toLowerCase()
  })
  return out
}

const VALID_DIFFICULTY = ['easy', 'medium', 'hard']

export const recallGridService = {
  // Latest rows by default; a search or filter reaches every row in the pool.
  async fetchGrid({ search = '', filters = null, limit = 400 } = {}) {
    const f = filters || {}

    const applyFilters = (query) => {
      if (f.source && f.source !== 'all') query = query.eq('source_type', f.source)
      if (f.years?.length) query = query.in('year', f.years.map(Number))
      if (f.yearFrom) query = query.gte('year', Number(f.yearFrom))
      if (f.yearTo) query = query.lte('year', Number(f.yearTo))
      if (f.unit?.length) query = query.in('unit_code', f.unit)
      if (f.macro?.length) query = query.in('macro_topic', f.macro)
      if (f.micro?.length) query = query.in('micro_topic', f.micro)
      if (f.key?.length) query = query.in('correct_option', f.key.filter(k => k !== 'E'))
      if (f.difficulty?.length) {
        query = query.or(f.difficulty.map(d => `difficulty_level.ilike.${cleanTerm(d)}`).join(','))
      }
      const columnText = cleanTerm(f.text)
      if (columnText) {
        query = query.or(`question_text.ilike.%${columnText}%,question_ta.ilike.%${columnText}%`)
      }
      const term = cleanTerm(search)
      if (term) {
        const parts = [
          `question_text.ilike.%${term}%`,
          `question_ta.ilike.%${term}%`,
          `unit_code.ilike.%${term}%`,
          `macro_topic.ilike.%${term}%`,
          `micro_topic.ilike.%${term}%`,
        ]
        if (UUID_PATTERN.test(term)) parts.push(`id.eq.${term}`)
        query = query.or(parts.join(','))
      }
      return query
    }

    // Supabase returns at most 1000 rows per request, so page through the result.
    const CHUNK = 1000
    const rows = []
    while (rows.length < limit) {
      const from = rows.length
      const to = Math.min(from + CHUNK, limit) - 1
      const { data, error } = await applyFilters(supabase.from('recall_questions').select('*'))
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
      if (error) throw explain(error)
      rows.push(...(data || []))
      if (!data || data.length < to - from + 1) break
    }
    return { questions: rows.map(toGridRow), papers: [] }
  },

  async getInventory() {
    const { count, error } = await supabase
      .from('recall_questions')
      .select('id', { count: 'exact', head: true })
    if (error) throw explain(error)
    return { total: count || 0, byUnit: {} }
  },

  // Filter-menu options from the whole pool, not just the rows on screen.
  async getFacets() {
    const sets = { unit: new Set(), macro: new Set(), micro: new Set(), years: new Set() }
    const CHUNK = 1000
    for (let from = 0; from < 10000; from += CHUNK) {
      const { data, error } = await supabase
        .from('recall_questions')
        .select('unit_code, macro_topic, micro_topic, year')
        .order('id', { ascending: true })
        .range(from, from + CHUNK - 1)
      if (error) throw explain(error)
      ;(data || []).forEach(row => {
        if (row.unit_code) sets.unit.add(row.unit_code)
        if (row.macro_topic) sets.macro.add(row.macro_topic)
        if (row.micro_topic) sets.micro.add(row.micro_topic)
        if (row.year) sets.years.add(String(row.year))
      })
      if (!data || data.length < CHUNK) break
    }
    const sorted = (set) => Array.from(set).sort()
    return { unit: sorted(sets.unit), macro: sorted(sets.macro), micro: sorted(sets.micro), years: sorted(sets.years) }
  },

  async updateFields(id, fields) {
    if (!id) throw new Error('Question ID is required')
    const payload = { ...toRecallColumns(fields), updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('recall_questions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw explain(error)
    return data
  },

  async deleteBulk(items) {
    const ids = (items || []).map(item => item?.id).filter(Boolean)
    const CHUNK = 200
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await supabase.from('recall_questions').delete().in('id', ids.slice(i, i + CHUNK))
      if (error) throw error
    }
    return ids.length
  },

  // True when a PYQ question with this SHA-256 hash is already in the pool.
  async hasPyqDuplicate(contentHash, excludeId) {
    if (!contentHash) return false
    let query = supabase
      .from('recall_questions')
      .select('id', { count: 'exact', head: true })
      .eq('content_hash', contentHash)
      .eq('source_type', 'PYQ')
    if (excludeId) query = query.neq('id', excludeId)
    const { count, error } = await query
    if (error) return false
    return (count || 0) > 0
  },

  // Inserts validated 29-column rows. Rows whose SHA-256 hash is already in
  // the pool are skipped, so re-uploading a file does not create duplicates.
  async importRows(rows) {
    const list = rows || []
    let inserted = 0
    let skipped = 0
    const CHUNK = 100

    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK)

      const hashes = chunk.map(q => q.content_hash).filter(Boolean)
      let existing = new Set()
      if (hashes.length) {
        const { data, error } = await supabase
          .from('recall_questions')
          .select('content_hash')
          .in('content_hash', hashes)
        if (error) throw explain(error)
        existing = new Set((data || []).map(r => r.content_hash))
      }

      const seenInChunk = new Set()
      const fresh = chunk.filter(q => {
        if (q.content_hash && (existing.has(q.content_hash) || seenInChunk.has(q.content_hash))) return false
        if (q.content_hash) seenInChunk.add(q.content_hash)
        return true
      })
      skipped += chunk.length - fresh.length
      if (fresh.length === 0) continue

      const payload = fresh.map(q => {
        const difficulty = String(q.difficulty_level || 'medium').toLowerCase()
        return {
          question_text: q.en_question_text,
          question_ta: q.ta_question_text || null,
          option_a: q.en_option_a,
          option_b: q.en_option_b,
          option_c: q.en_option_c,
          option_d: q.en_option_d,
          option_a_tamil: q.ta_option_a || null,
          option_b_tamil: q.ta_option_b || null,
          option_c_tamil: q.ta_option_c || null,
          option_d_tamil: q.ta_option_d || null,
          correct_option: String(q.answer_key || 'A').toUpperCase(),
          explanation: q.en_explanation || null,
          explanation_tamil: q.ta_explanation || null,
          subject: q.subject_name || 'General Studies',
          topic: q.macro_topic || 'General',
          difficulty: VALID_DIFFICULTY.includes(difficulty) ? difficulty : 'medium',
          exam_context: q.exam_tag,
          exam_tag: q.exam_tag,
          source_type: q.source_type === 'PYQ' ? 'PYQ' : 'VINA',
          year: q.year || null,
          subject_name: q.subject_name || null,
          unit_code: q.unit_code || null,
          macro_topic: q.macro_topic || null,
          micro_topic: q.micro_topic || null,
          sub_topic: q.sub_topic || null,
          difficulty_level: String(q.difficulty_level || 'MEDIUM').toUpperCase(),
          question_type: q.question_type || 'MULTIPLE_CHOICE',
          cognitive_skill: q.cognitive_skill || null,
          ideal_time_seconds: q.ideal_time_seconds || 54,
          content_hash: q.content_hash || null,
          is_active: true,
          for_daily: true,
          status: 'published',
        }
      })

      const { error } = await supabase.from('recall_questions').insert(payload)
      if (error) throw explain(error)
      inserted += payload.length
    }
    return { inserted, skipped }
  },
}
