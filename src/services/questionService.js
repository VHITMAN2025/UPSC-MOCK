import { supabase } from '../lib/supabase.js'
import { CANONICAL_SYLLABUS_TAXONOMY, syllabusAnalyticsService } from './syllabusAnalyticsService.js'

const CANONICAL_MICROS = CANONICAL_SYLLABUS_TAXONOMY.flatMap(u =>
  u.macro_topics.flatMap(mt =>
    mt.micro_topics.map(m => ({
      ...m,
      unit_name: u.unit_name,
      macro_topic_name: mt.macro_topic_name,
    }))
  )
)

export const questionService = {
  async getQuestionsByPaperId(paperId, isExamMode = false) {
    let selectFields = '*'
    
    // In exam mode, do not expose correct_option or explanation to client network responses
    if (isExamMode) {
      selectFields = 'id, paper_id, question_number, question_text, option_a, option_b, option_c, option_d, question_text_tamil, option_a_tamil, option_b_tamil, option_c_tamil, option_d_tamil, group_tag, group_name, unit_tag, unit_name, macro_topic, macro_topic_name, micro_topic, micro_topic_name, micro_topic_id, exam_year, is_pyq, difficulty_level, tags'
    }

    let { data, error } = await supabase
      .from('questions')
      .select(selectFields)
      .eq('paper_id', paperId)
      .order('question_number', { ascending: true })

    // Resilient fallback if some metadata columns are not yet applied on Supabase table
    if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
      const basicFields = isExamMode
        ? 'id, paper_id, question_number, question_text, option_a, option_b, option_c, option_d, question_text_tamil, option_a_tamil, option_b_tamil, option_c_tamil, option_d_tamil'
        : '*'
      const fallbackRes = await supabase
        .from('questions')
        .select(basicFields)
        .eq('paper_id', paperId)
        .order('question_number', { ascending: true })
      data = fallbackRes.data
      error = fallbackRes.error
    }

    if (error) throw error

    // Ensure all 5 identifiers are always populated on every question
    return (data || []).map(q => {
      let group = q.group_tag || q.group_name || null
      let unit = q.unit_tag || q.unit_name || null
      let macro = q.macro_topic || q.macro_topic_name || null
      let micro = q.micro_topic || q.micro_topic_name || null
      let year = q.exam_year || null
      let isPyq = q.is_pyq ?? null

      const expl = q.explanation || ''
      if (expl.includes('[Metadata:')) {
        const gMatch = expl.match(/Group=([^|\]]+)/i)
        const uMatch = expl.match(/Unit=([^|\]]+)/i)
        const maMatch = expl.match(/Macro=([^|\]]+)/i)
        const miMatch = expl.match(/Micro=([^|\]]+)/i)
        const yMatch = expl.match(/Year=([^|\]]+)/i)
        const pMatch = expl.match(/PYQ=([^|\]]+)/i)
        if (gMatch && !group) group = gMatch[1].trim()
        if (uMatch && !unit) unit = uMatch[1].trim()
        if (maMatch && !macro) macro = maMatch[1].trim()
        if (miMatch && !micro) micro = miMatch[1].trim()
        if (yMatch && !year) year = yMatch[1].trim()
        if (pMatch && isPyq === null) isPyq = pMatch[1].trim() === 'true'
      } else if (expl.includes('[Taxonomy:')) {
        const taxMatch = expl.match(/\[Taxonomy:\s*([^>\]]+)(?:>\s*([^>\]]+))?(?:>\s*([^>\]]+))?\]/i)
        if (taxMatch) {
          if (!unit) unit = taxMatch[1]?.trim()
          if (!macro) macro = taxMatch[2]?.trim()
          if (!micro) micro = taxMatch[3]?.trim()
        }
      }

      return {
        ...q,
        group_tag: group || 'Group 4',
        group_name: group ? (group.startsWith('TNPSC') ? group : `TNPSC ${group}`) : 'TNPSC Group 4',
        unit_tag: unit ? (unit.startsWith('Unit') ? unit.split('—')[0].trim() : unit) : 'Unit 1',
        unit_name: unit || 'Unit 1 — General Science',
        macro_topic: macro || 'General Studies',
        macro_topic_name: macro || 'General Studies',
        micro_topic: micro || 'General Concepts',
        micro_topic_name: micro || 'General Concepts',
        exam_year: year || '2024',
        is_pyq: isPyq !== null ? Boolean(isPyq) : Boolean(q.is_pyq),
        difficulty_level: q.difficulty_level || 'Medium',
      }
    })
  },

  async getExistingQuestionCount(paperId) {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('paper_id', paperId)

    if (error) throw error
    return count || 0
  },

  async queryQuestionsByCriteria({
    groupTag,
    groupName,
    unitTag,
    unitName,
    unitId,
    unitCode,
    macroTopic,
    microTopic,
    microTopicId,
    examYear,
    isPyq,
    difficultyLevel,
    partCode,
    tags,
    limit = 100
  } = {}) {
    let query = supabase.from('questions').select('*')

    if (groupTag) {
      query = query.eq('group_tag', groupTag)
    } else if (groupName) {
      query = query.or(`group_name.eq.${groupName},group_tag.eq.${groupName}`)
    }

    if (unitTag) {
      query = query.eq('unit_tag', unitTag)
    } else if (unitName) {
      query = query.eq('unit_name', unitName)
    }

    if (macroTopic) {
      query = query.or(`macro_topic.eq.${macroTopic},macro_topic_name.eq.${macroTopic}`)
    }

    if (microTopic) {
      query = query.or(`micro_topic.eq.${microTopic},micro_topic_name.eq.${microTopic}`)
    }

    if (microTopicId) {
      query = query.eq('micro_topic_id', microTopicId)
    }

    if (examYear) {
      query = query.eq('exam_year', String(examYear))
    }

    if (isPyq !== undefined && isPyq !== null) {
      query = query.eq('is_pyq', Boolean(isPyq))
    }

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }
    if (unitCode) {
      query = query.eq('unit_code', unitCode)
    }
    if (partCode) {
      query = query.eq('part_code', partCode)
    }
    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel)
    }
    if (tags && Array.isArray(tags) && tags.length > 0) {
      query = query.contains('tags', tags)
    }
    if (limit) {
      query = query.limit(limit)
    }

    let { data, error } = await query
    if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
      // Fallback query without metadata columns
      console.warn('[questionService] queryQuestionsByCriteria column fallback:', error.message)
      const fb = await supabase.from('questions').select('*').limit(limit)
      data = fb.data
      error = fb.error
    }

    if (error) {
      console.warn('[questionService] queryQuestionsByCriteria error:', error)
      return []
    }
    return data || []
  },

  async createQuestion(questionData) {
    let payload = { ...questionData }
    const gTag = payload.group_tag || 'Group 4'
    const uTag = payload.unit_tag || (payload.unit_name ? (payload.unit_name.startsWith('Unit') ? payload.unit_name.split('—')[0].trim() : payload.unit_name) : 'Unit 1')
    const mName = payload.macro_topic || payload.macro_topic_name || 'General'
    const miName = payload.micro_topic || payload.micro_topic_name || 'General Concepts'
    const eYear = payload.exam_year || '2024'
    const pyq = Boolean(payload.is_pyq)

    let expl = payload.explanation || ''
    if (!expl.includes('[Metadata:')) {
      const metaTag = `[Metadata: Group=${gTag} | Unit=${uTag} | Macro=${mName} | Micro=${miName} | Year=${eYear} | PYQ=${pyq}]`
      expl = expl ? `${metaTag}\n\n${expl}` : metaTag
      payload.explanation = expl
    }

    let { data, error } = await supabase
      .from('questions')
      .insert([payload])
      .select()
      .single()

    if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
      const {
        group_tag, group_name, unit_tag, unit_name,
        macro_topic, macro_topic_name, micro_topic, micro_topic_name,
        micro_topic_id, exam_year, is_pyq, difficulty_level, tags, ...basePayload
      } = payload
      const retry = await supabase.from('questions').insert([basePayload]).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    await this.updatePaperTotalQuestions(questionData.paper_id)
    return data
  },

  async updateQuestion(questionId, updates) {
    let payload = { ...updates, updated_at: new Date().toISOString() }
    const gTag = payload.group_tag || 'Group 4'
    const uTag = payload.unit_tag || (payload.unit_name ? (payload.unit_name.startsWith('Unit') ? payload.unit_name.split('—')[0].trim() : payload.unit_name) : 'Unit 1')
    const mName = payload.macro_topic || payload.macro_topic_name || 'General'
    const miName = payload.micro_topic || payload.micro_topic_name || 'General Concepts'
    const eYear = payload.exam_year || '2024'
    const pyq = Boolean(payload.is_pyq)

    if (payload.explanation !== undefined) {
      let expl = (payload.explanation || '')
        .replace(/\[Metadata:[^\]]+\]\s*/g, '')
        .replace(/\[Taxonomy:[^\]]+\]\s*/g, '')
        .trim()
      const metaTag = `[Metadata: Group=${gTag} | Unit=${uTag} | Macro=${mName} | Micro=${miName} | Year=${eYear} | PYQ=${pyq}]`
      payload.explanation = expl ? `${metaTag}\n\n${expl}` : metaTag
    }

    let { data, error } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', questionId)
      .select()
      .single()

    if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
      const {
        group_tag, group_name, unit_tag, unit_name,
        macro_topic, macro_topic_name, micro_topic, micro_topic_name,
        micro_topic_id, exam_year, is_pyq, difficulty_level, tags, ...basePayload
      } = payload
      const retry = await supabase.from('questions').update(basePayload).eq('id', questionId).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    return data
  },

  async deleteQuestion(questionId, paperId) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) throw error

    if (paperId) {
      await this.updatePaperTotalQuestions(paperId)
    }
    return true
  },

  async batchImportQuestions(paperId, questionsList) {
    return this.saveQuestionsToSupabase(paperId, questionsList, false)
  },

  async saveQuestionsToSupabase(paperId, questionsList, replaceExisting = false) {
    if (!paperId) throw new Error('Paper ID is required to save questions.')
    if (!questionsList || questionsList.length === 0) {
      throw new Error('No questions provided for import.')
    }

    // Helper: Sanitize database text - remove ONLY null bytes (U+0000)
    const sanitizeDatabaseText = (value) => {
      if (typeof value !== 'string') return value
      const cleaned = value.replace(/\u0000/g, '')
      if (cleaned !== value) {
        console.warn('[UNICODE-TRACE][DATABASE-SANITIZE] Removed null bytes from field')
      }
      return cleaned
    }

    // 1. If replaceExisting is true, delete existing questions for paper_id
    if (replaceExisting) {
      const { error: delErr } = await supabase
        .from('questions')
        .delete()
        .eq('paper_id', paperId)

      if (delErr) throw delErr
    }

    // Fetch linked paper metadata to extract exam group and year
    let paperMeta = null
    try {
      const { data: p } = await supabase
        .from('papers')
        .select('id, title, exam_name, year')
        .eq('id', paperId)
        .maybeSingle()
      paperMeta = p
    } catch {}

    const paperExam = paperMeta?.exam_name || paperMeta?.title || 'TNPSC Group 4'
    const defaultGroupTag = paperExam.includes('Group 1') ? 'Group 1' : paperExam.includes('Group 2') ? 'Group 2' : 'Group 4'
    const defaultYear = String(paperMeta?.year || '2024')

    // 2. Map frontend fields to actual Supabase database schema with automatic 3-level taxonomy classification
    const formattedList = questionsList.map((q, idx) => {
      const opt = q.correct_option || q.marked_answer ? String(q.correct_option || q.marked_answer).toUpperCase().trim() : null
      const validOpt = ['A', 'B', 'C', 'D'].includes(opt) ? opt : null

      // Options mapping (support both option_a / options array)
      let optA = q.option_a || ''
      let optB = q.option_b || ''
      let optC = q.option_c || ''
      let optD = q.option_d || ''

      if (Array.isArray(q.options)) {
        q.options.forEach((o) => {
          if (o.label === 'A') optA = o.text
          if (o.label === 'B') optB = o.text
          if (o.label === 'C') optC = o.text
          if (o.label === 'D') optD = o.text
        })
      }

      // Automatic 3-Level Syllabus Categorization
      // Level 1: Unit, Level 2: Macro-Topic, Level 3: Micro-Topic
      let unitName = q.unit_name || null
      let macroName = q.macro_topic_name || q.macro_topic || null
      let microName = q.micro_topic_name || q.micro_topic || null

      if (!unitName || !macroName || !microName) {
        const matched = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, CANONICAL_MICROS)
        if (matched) {
          unitName = unitName || matched.unit_name
          macroName = macroName || matched.macro_topic_name
          microName = microName || matched.micro_topic_name
        }
      }

      // Default fallbacks if still unmapped
      unitName = unitName || 'Unit 1 — General Science'
      macroName = macroName || 'General Studies'
      microName = microName || 'General Concepts'

      const groupTag = q.group_tag || defaultGroupTag
      const groupName = q.group_name || `TNPSC ${groupTag}`
      const unitTag = q.unit_tag || (unitName.startsWith('Unit') ? unitName.split('—')[0].trim() : 'Unit 1')
      const examYear = String(q.exam_year || q.year || defaultYear)
      const isPyq = Boolean(q.is_pyq ?? (paperMeta?.year ? true : false))

      // Embed resilient metadata guarantee tag into explanation
      let baseExplanation = sanitizeDatabaseText(q.explanation || q.extraction_notes || '') || ''
      const metaTag = `[Metadata: Group=${groupTag} | Unit=${unitTag} | Macro=${macroName} | Micro=${microName} | Year=${examYear} | PYQ=${isPyq}]`
      if (!baseExplanation.includes('[Metadata:')) {
        baseExplanation = baseExplanation ? `${metaTag}\n\n${baseExplanation}` : metaTag
      }

      const qTags = Array.from(new Set([
        ...(Array.isArray(q.tags) ? q.tags : []),
        groupTag,
        unitTag,
        microName,
        macroName,
        unitName,
        examYear,
        isPyq ? 'PYQ' : 'Mock',
      ].filter(Boolean)))

      // CRITICAL: Sanitize all text fields to remove null bytes before database insert
      const sanitized = {
        paper_id: paperId,
        question_number: parseInt(q.question_number, 10),
        question_text: sanitizeDatabaseText(q.question_text || ''),
        option_a: sanitizeDatabaseText(optA),
        option_b: sanitizeDatabaseText(optB),
        option_c: sanitizeDatabaseText(optC),
        option_d: sanitizeDatabaseText(optD),
        correct_option: validOpt,
        explanation: baseExplanation,
        source_pdf: sanitizeDatabaseText(q.source_pdf || null),
        page_number: q.page_number || 1,
        question_text_tamil: sanitizeDatabaseText(q.question_text_tamil || q.tamil_question || null),
        option_a_tamil: sanitizeDatabaseText(q.option_a_tamil || null),
        option_b_tamil: sanitizeDatabaseText(q.option_b_tamil || null),
        option_c_tamil: sanitizeDatabaseText(q.option_c_tamil || null),
        option_d_tamil: sanitizeDatabaseText(q.option_d_tamil || null),
        explanation_tamil: sanitizeDatabaseText(q.explanation_tamil || null),
        group_tag: groupTag,
        group_name: groupName,
        unit_tag: unitTag,
        unit_name: unitName,
        macro_topic: macroName,
        macro_topic_name: macroName,
        micro_topic: microName,
        micro_topic_name: microName,
        micro_topic_id: q.micro_topic_id || null,
        exam_year: examYear,
        is_pyq: isPyq,
        difficulty_level: q.difficulty_level || 'Medium',
        tags: qTags,
      }

      // Log null byte removal for first few questions
      if (idx < 3) {
        const hadNullBytes = [q.question_text, optA, optB, optC, optD, q.explanation]
          .filter(v => v && typeof v === 'string' && v.includes('\u0000')).length
        if (hadNullBytes > 0) {
          console.log(`[UNICODE-TRACE][DATABASE-PAYLOAD] Q${sanitized.question_number} nullByteFields=${hadNullBytes} (sanitized)`)
        }
      }

      return sanitized
    })

    // Deduplicate formatted list by question_number to ensure PostgreSQL ON CONFLICT DO UPDATE never encounters duplicate keys in a single batch
    const uniqueMap = new Map()
    formattedList.forEach((q, idx) => {
      const qNum = isNaN(q.question_number) || !q.question_number ? idx + 1 : q.question_number
      q.question_number = qNum
      uniqueMap.set(qNum, q)
    })
    const uniqueList = Array.from(uniqueMap.values())

    // 3. Batch insert in chunks of 25 items to handle large question sets safely
    const BATCH_SIZE = 25
    const insertedRecords = []
    let totalInserted = 0

    console.log(`[questionService] Starting batch insert: ${uniqueList.length} questions, paperId=${paperId}`)

    for (let i = 0; i < uniqueList.length; i += BATCH_SIZE) {
      const batch = uniqueList.slice(i, i + BATCH_SIZE)

      let { data, error } = await supabase
        .from('questions')
        .upsert(batch, { onConflict: 'paper_id,question_number' })
        .select()

      // Resilient fallback: if Supabase returns code 42703 (undefined column) or message indicates column does not exist,
      // strip taxonomy columns and upsert base fields without crashing
      if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
        console.warn(`[questionService] Metadata columns not yet in DB schema, falling back to base question schema:`, error.message)
        const strippedBatch = batch.map(({
          group_tag, group_name, unit_tag, unit_name,
          macro_topic, macro_topic_name, micro_topic, micro_topic_name,
          micro_topic_id, exam_year, is_pyq, difficulty_level, tags, ...rest
        }) => rest)
        const retryRes = await supabase
          .from('questions')
          .upsert(strippedBatch, { onConflict: 'paper_id,question_number' })
          .select()
        data = retryRes.data
        error = retryRes.error
      }

      if (error) {
        console.error(`[questionService] Batch insert error at index ${i}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database import failed at question batch (${i + 1}-${i + batch.length}): ${error.message}`)
      }

      if (data) {
        insertedRecords.push(...data)
        totalInserted += data.length
      }
    }

    console.log(`[questionService] QUESTIONS INSERT SUCCESS:`, {
      paperId,
      insertedCount: totalInserted,
      totalBatches: Math.ceil(uniqueList.length / BATCH_SIZE)
    })

    // 4. Update total_questions count on papers table
    await this.updatePaperTotalQuestions(paperId)

    return insertedRecords
  },

  async saveExtractedDocument(docMetadata) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .insert([{
        user_id: user?.id || null,
        paper_id: docMetadata.paperId || null,
        file_name: docMetadata.fileName,
        storage_path: docMetadata.storagePath || null,
        total_pages: docMetadata.totalPages || 0,
        processing_status: docMetadata.processingStatus || 'completed',
        total_questions: docMetadata.totalQuestions || 0,
        extracted_summary: docMetadata.summaryMetrics || {}
      }])
      .select()
      .single()

    if (error) {
      console.warn('Document record insert note:', error)
      return null
    }

    return data
  },

  async saveExtractedQuestions(documentId, paperId, extractedQuestions) {
    if (!extractedQuestions || extractedQuestions.length === 0) return []

    const formattedList = extractedQuestions.map((q) => ({
      document_id: documentId || null,
      paper_id: paperId || null,
      question_number: parseInt(q.question_number, 10),
      question_text: q.question_text || '',
      options_json: q.options || [],
      marked_answer: q.marked_answer || null,
      marked_option_index: q.marked_option_index ?? null,
      answer_status: q.answer_status || 'not_marked',
      confidence: q.confidence ?? 0,
      page_number: q.page_number ?? 1,
      extraction_notes: q.extraction_notes || null,
      manually_edited: q.manually_edited || false,
      verified: true
    }))

    const { data, error } = await supabase
      .from('extracted_questions')
      .insert(formattedList)
      .select()

    if (error) {
      console.warn('Extracted questions record insert note:', error)
    }

    return data || []
  },

  async getAllExtractedQuestionsForAdmin({ search = '', unit = '', paperId = '', limit = 2000 } = {}) {
    // 1. Fetch papers for title and metadata lookup
    const { data: papersData, error: pErr } = await supabase
      .from('papers')
      .select('id, title, exam_name, exam_type, year, total_questions, created_at')
      .order('created_at', { ascending: false })

    if (pErr) console.warn('[questionService] Error fetching papers list:', pErr)
    const papersMap = new Map((papersData || []).map(p => [p.id, p]))

    // 2. Query questions from database
    let query = supabase
      .from('questions')
      .select('id, paper_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, source_pdf, page_number, question_text_tamil, option_a_tamil, option_b_tamil, option_c_tamil, option_d_tamil, explanation_tamil, created_at')
      .order('created_at', { ascending: false })

    if (paperId && paperId !== 'all') {
      query = query.eq('paper_id', paperId)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: rawQuestions, error: qErr } = await query
    if (qErr) throw qErr

    // 3. Enrich each question with Level 1, 2, and 3 taxonomy
    const enriched = (rawQuestions || []).map((q) => {
      const linkedPaper = papersMap.get(q.paper_id)
      let unitName = null
      let macroName = null
      let microName = null

      if (q.explanation && q.explanation.includes('[Taxonomy:')) {
        const m = q.explanation.match(/\[Taxonomy:\s*([^>]+)\s*>\s*([^>]+)\s*>\s*([^\]]+)\]/)
        if (m) {
          unitName = m[1]?.trim()
          macroName = m[2]?.trim()
          microName = m[3]?.trim()
        }
      }

      if (!unitName || !macroName || !microName) {
        const matched = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, CANONICAL_MICROS)
        if (matched) {
          unitName = unitName || matched.unit_name
          macroName = macroName || matched.macro_topic_name
          microName = microName || matched.micro_topic_name
        }
      }

      unitName = unitName || 'Unit I: General Science'
      macroName = macroName || 'General Studies'
      microName = microName || 'General Concepts'

      const paperTitle = linkedPaper?.title || q.source_pdf || 'Extracted Paper'
      const sourcePdfName = q.source_pdf || linkedPaper?.title || 'Uploaded PDF'

      return {
        ...q,
        unit_name: unitName,
        macro_topic_name: macroName,
        micro_topic_name: microName,
        paper_title: paperTitle,
        paper_exam_name: linkedPaper?.exam_name || 'TNPSC',
        paper_year: linkedPaper?.year || null,
        source_pdf_display: sourcePdfName,
        has_db_taxonomy: Boolean(q.explanation && q.explanation.includes('[Taxonomy:')),
      }
    })

    return {
      questions: enriched,
      papers: papersData || [],
      totalCount: enriched.length,
    }
  },

  async updateQuestionTopic(questionId, { unitName, macroTopicName, microTopicName, groupTag, examYear, isPyq }) {
    if (!questionId) throw new Error('Question ID is required')

    // Read current question
    const { data: currentQ, error: fetchErr } = await supabase
      .from('questions')
      .select('explanation, group_tag, exam_year, is_pyq')
      .eq('id', questionId)
      .single()

    if (fetchErr) throw fetchErr

    const gTag = groupTag || currentQ?.group_tag || 'Group 4'
    const uTag = unitName ? (unitName.startsWith('Unit') ? unitName.split('—')[0].trim() : unitName) : 'Unit 1'
    const eYear = String(examYear || currentQ?.exam_year || '2024')
    const pyqFlag = isPyq !== undefined ? Boolean(isPyq) : Boolean(currentQ?.is_pyq)

    let baseExpl = (currentQ?.explanation || '')
      .replace(/\[Metadata:[^\]]+\]\s*/g, '')
      .replace(/\[Taxonomy:[^\]]+\]\s*/g, '')
      .trim()
    const metaTag = `[Metadata: Group=${gTag} | Unit=${uTag} | Macro=${macroTopicName || 'General'} | Micro=${microTopicName || 'General Concepts'} | Year=${eYear} | PYQ=${pyqFlag}]`
    const updatedExpl = baseExpl ? `${metaTag}\n\n${baseExpl}` : metaTag

    const updates = {
      explanation: updatedExpl,
      updated_at: new Date().toISOString()
    }

    // Try full metadata columns
    let { data, error } = await supabase
      .from('questions')
      .update({
        ...updates,
        group_tag: gTag,
        unit_tag: uTag,
        unit_name: unitName,
        macro_topic: macroTopicName || 'General',
        macro_topic_name: macroTopicName || 'General',
        micro_topic: microTopicName || 'General Concepts',
        micro_topic_name: microTopicName || 'General Concepts',
        exam_year: eYear,
        is_pyq: pyqFlag,
      })
      .eq('id', questionId)
      .select()
      .single()

    // If column missing in schema, fallback to explanation only
    if (error && (error.code === '42703' || String(error.message).toLowerCase().includes('column'))) {
      const fb = await supabase
        .from('questions')
        .update(updates)
        .eq('id', questionId)
        .select()
        .single()
      data = fb.data
      error = fb.error
    }

    if (error) throw error
    return data
  },

  async batchClassifyAndSaveTopics(onProgress) {
    const { data: unclassified, error: fetchErr } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, explanation')
      .not('explanation', 'ilike', '%[Metadata:%')
      .limit(500)

    if (fetchErr) throw fetchErr
    if (!unclassified || unclassified.length === 0) return { updatedCount: 0, message: 'All questions already have saved topics in database!' }

    let updatedCount = 0
    const total = unclassified.length

    for (let i = 0; i < unclassified.length; i++) {
      const q = unclassified[i]
      const match = syllabusAnalyticsService.classifyQuestionToMicroTopic(q, CANONICAL_MICROS)
      const uName = match?.unit_name || 'Unit 1 — General Science'
      const mName = match?.macro_topic_name || 'General Studies'
      const miName = match?.micro_topic_name || 'General Concepts'
      const uTag = uName.startsWith('Unit') ? uName.split('—')[0].trim() : 'Unit 1'
      const gTag = 'Group 4'
      const eYear = '2024'
      const isPyq = false

      let expl = (q.explanation || '')
        .replace(/\[Metadata:[^\]]+\]\s*/g, '')
        .replace(/\[Taxonomy:[^\]]+\]\s*/g, '')
        .trim()
      const metaTag = `[Metadata: Group=${gTag} | Unit=${uTag} | Macro=${mName} | Micro=${miName} | Year=${eYear} | PYQ=${isPyq}]`
      const newExpl = expl ? `${metaTag}\n\n${expl}` : metaTag

      try {
        const { error } = await supabase
          .from('questions')
          .update({
            explanation: newExpl,
            group_tag: gTag,
            unit_tag: uTag,
            unit_name: uName,
            macro_topic: mName,
            macro_topic_name: mName,
            micro_topic: miName,
            micro_topic_name: miName,
            exam_year: eYear,
            is_pyq: isPyq,
          })
          .eq('id', q.id)

        if (!error) updatedCount++
        else {
          // Fallback to updating explanation
          await supabase.from('questions').update({ explanation: newExpl }).eq('id', q.id)
          updatedCount++
        }
      } catch {
        // Continue
      }

      if (onProgress && (i % 10 === 0 || i === total - 1)) {
        onProgress({ current: i + 1, total, updatedCount })
      }
    }

    return { updatedCount, total }
  },

  async updatePaperTotalQuestions(paperId) {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('paper_id', paperId)

    if (count !== null) {
      await supabase
        .from('papers')
        .update({ total_questions: count, updated_at: new Date().toISOString() })
        .eq('id', paperId)
    }
  }
}
