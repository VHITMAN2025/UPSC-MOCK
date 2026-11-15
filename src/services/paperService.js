import { supabase } from '../lib/supabase'

// Exam group tag used on questions -> the exam name stored on papers
export const EXAM_NAME_BY_TAG = {
  TNPSC_GROUP_1: 'TNPSC Group 1',
  TNPSC_GROUP_2: 'TNPSC Group 2/2A',
  TNPSC_GROUP_4: 'TNPSC Group 4',
}

export const paperService = {
  async getPublishedPapers(filters = {}) {
    let query = supabase
      .from('papers')
      .select('*')
      .eq('status', 'published')

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters.year && filters.year !== 'all') {
      query = query.eq('year', parseInt(filters.year, 10))
    }
    if (filters.examType && filters.examType !== 'all') {
      query = query.eq('exam_type', filters.examType)
    }
    if (filters.subject && filters.subject !== 'all') {
      query = query.eq('subject', filters.subject)
    }
    // Filter by exam name (used by Mock Tests, PYQ pages)
    // Matches exact exam_name OR case-insensitive title patterns for Group 4 / Group 1 / Group 2 papers
    if (filters.examName) {
      const name = filters.examName
      if (name.includes('Group 4')) {
        query = query.or(`exam_name.eq.${name},exam_name.ilike.%Group 4%,title.ilike.%Group 4%,title.ilike.%Group-4%`)
      } else if (name.includes('Group 1')) {
        query = query.or(`exam_name.eq.${name},exam_name.ilike.%Group 1%,title.ilike.%Group 1%,title.ilike.%Group-1%`)
      } else if (name.includes('Group 2')) {
        query = query.or(`exam_name.eq.${name},exam_name.ilike.%Group 2%,title.ilike.%Group 2%,title.ilike.%Group-2%`)
      } else {
        query = query.eq('exam_name', name)
      }
    }

    if (filters.sort === 'year_asc') {
      query = query.order('year', { ascending: true })
    } else {
      query = query.order('year', { ascending: false }).order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getAllPapersForAdmin() {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getPaperById(paperId) {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', paperId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * The one Previous Year paper for an exam group and year. Official questions
   * (source_type PYQ) are filed here by their group and year, so they show up under
   * that year on the student's Previous Year Papers page without any manual step.
   * The title carries the group and year because that page matches papers on them.
   */
  async ensurePyqPaper({ examTag, year }) {
    const examName = EXAM_NAME_BY_TAG[examTag]
    if (!examName) throw new Error(`Unknown exam group "${examTag}".`)
    const yearNumber = Number(year)
    if (!Number.isInteger(yearNumber)) throw new Error(`A year is needed to file a ${examName} Previous Year paper.`)

    const title = `${examName} Previous Year Paper ${yearNumber}`

    // Reuse the paper made earlier for this group and year, however it was created
    const { data: byType, error: typeError } = await supabase
      .from('papers')
      .select('*')
      .eq('exam_name', examName)
      .eq('exam_type', 'Previous Year')
      .eq('year', yearNumber)
      .order('created_at', { ascending: true })
      .limit(1)
    if (typeError) throw typeError
    if (byType?.[0]) return byType[0]

    const { data: byTitle, error: titleError } = await supabase
      .from('papers')
      .select('*')
      .ilike('title', title)
      .order('created_at', { ascending: true })
      .limit(1)
    if (titleError) throw titleError
    if (byTitle?.[0]) return byTitle[0]

    // 200 questions in 180 minutes at 1.5 marks each, as set out for all three groups
    return this.createPaper({
      title,
      exam_name: examName,
      exam_type: 'Previous Year',
      year: yearNumber,
      subject: 'General Studies',
      duration_minutes: 180,
      maximum_marks: 300,
      marks_per_question: 1.5,
      status: 'draft',
    })
  },

  /**
   * Publishes a paper only when it is safe for students: it must have questions and
   * every question must have a correct answer (otherwise it cannot be scored).
   * Returns what happened instead of throwing, so an import can report it.
   */
  async publishIfReady(paperId) {
    const { count: total, error: totalError } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('paper_id', paperId)
    if (totalError) throw totalError
    if (!total) return { published: false, total: 0, missing: 0 }

    const { count: missing, error: missingError } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('paper_id', paperId)
      .is('correct_option', null)
    if (missingError) throw missingError
    if (missing > 0) {
      // A paper already live must not keep questions that cannot be scored
      const { data: current } = await supabase.from('papers').select('status').eq('id', paperId).maybeSingle()
      const demoted = current?.status === 'published'
      if (demoted) await this.updatePaper(paperId, { status: 'draft' })
      return { published: false, total, missing, demoted }
    }

    await this.updatePaper(paperId, { status: 'published' })
    return { published: true, total, missing: 0 }
  },

  async createPaper(paperData) {
    const { data, error } = await supabase
      .from('papers')
      .insert([paperData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePaper(paperId, updates) {
    const { data, error } = await supabase
      .from('papers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', paperId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deletePaper(paperId) {
    // Cascade delete any questions for this paper first
    try {
      await supabase.from('questions').delete().eq('paper_id', paperId)
    } catch (e) {
      console.warn('Cascade deleting questions error:', e)
    }

    // Cascade delete any user attempts for this paper
    try {
      await supabase.from('user_attempts').delete().eq('paper_id', paperId)
    } catch (e) {
      console.warn('Cascade deleting attempts error:', e)
    }

    // Sync deletion: if this paper was linked to any uploaded_papers record, delete them so students cannot attempt them
    try {
      const { data: linkedUploads } = await supabase
        .from('uploaded_papers')
        .select('id, notes')
        .ilike('notes', `%${paperId}%`)

      if (linkedUploads && linkedUploads.length > 0) {
        for (const up of linkedUploads) {
          await supabase
            .from('uploaded_papers')
            .delete()
            .eq('id', up.id)
        }
      }
    } catch (e) {
      console.warn('Syncing paper deletion with uploaded_papers:', e)
    }

    const { error } = await supabase
      .from('papers')
      .delete()
      .eq('id', paperId)

    if (error) throw error

    return true
  },

  async togglePublishStatus(paperId, newStatus) {
    if (newStatus === 'published') {
      // Validate that paper has at least 1 question before publishing
      const { count, error: countErr } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('paper_id', paperId)

      if (countErr) throw countErr
      if (!count || count === 0) {
        throw new Error('Cannot publish a paper without questions. Add questions first.')
      }

      // Check if questions have correct_option
      const { data: questionsWithoutAnswer } = await supabase
        .from('questions')
        .select('id, question_number')
        .eq('paper_id', paperId)
        .is('correct_option', null)

      if (questionsWithoutAnswer && questionsWithoutAnswer.length > 0) {
        throw new Error(`Questions missing correct answer selection: Q# ${questionsWithoutAnswer.map(q => q.question_number).join(', ')}`)
      }
    }

    return this.updatePaper(paperId, { status: newStatus })
  },

  async getAdminStats() {
    const [papersRes, questionsRes, attemptsRes] = await Promise.all([
      supabase.from('papers').select('id, status'),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('attempts').select('id', { count: 'exact', head: true })
    ])

    const papers = papersRes.data || []
    return {
      totalPapers: papers.length,
      publishedPapers: papers.filter(p => p.status === 'published').length,
      draftPapers: papers.filter(p => p.status === 'draft').length,
      totalQuestions: questionsRes.count || 0,
      totalAttempts: attemptsRes.count || 0
    }
  }
}
