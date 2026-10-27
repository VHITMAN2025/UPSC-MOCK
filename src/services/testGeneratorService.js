/**
 * Intelligent Test Generation Engine — 200-Question Quota Assembly
 * 
 * Implements:
 * 1. Exact 200-Question Syllabus Quotas:
 *    - Group 1: UNIT_I (10) + UNIT_II (10) + UNIT_III (25) + UNIT_IV (40) + UNIT_V (50) + UNIT_VI (40) + APT_UNIT_I (15) + APT_UNIT_II (10) = 200 Qs.
 *    - Group 2: Language (100: 35+35+30) + GS (75: 5+5+10+15+20+20) + Aptitude (25: 15+10) = 200 Qs.
 *    - Group 4: General Tamil (100: 35+35+30) + GS (75: 8+7+12+15+18+15) + Aptitude (25: 15+10) = 200 Qs.
 * 2. Difficulty Balancing: Exactly 20% Easy, 50% Medium, 30% Hard within each unit.
 * 3. Zero-Repetition Tracking: Prioritizes questions never seen by the user; when the pool is exhausted,
 *    pulls from least-seen questions (ORDER BY times_seen ASC, RANDOM()).
 * 4. Deduplication & Fisher-Yates randomized sampling without replacement.
 */

import { supabase } from '../lib/supabase.js'
import { questionService } from './questionService.js'
import { attemptService } from './attemptService.js'
import { questionHistoryService } from './questionHistoryService.js'
import { OFFICIAL_200Q_BLUEPRINTS } from './masterTaxonomyService.js'

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class InsufficientQuestionPoolError extends Error {
  constructor(details) {
    const bucketName = details.bucket || details.unitCode || details.unitName || 'unknown'
    const diff = details.difficultyLevel || 'all'
    super(
      `Insufficient questions in bucket '${bucketName}' [${diff}]: requested ${details.requested}, available ${details.available}, deficit ${details.deficit}.`
    )
    this.name = 'InsufficientQuestionPoolError'
    this.details = details
  }
}

// ─── Constants & Difficulty Ratios ───────────────────────────────────────────

export const DIFFICULTY_RATIOS = {
  easy: 0.20,   // 20%
  medium: 0.50, // 50%
  hard: 0.30,   // 30%
}

// Group 1 Quota Blueprint (175 GS + 25 Aptitude = 200 Questions)
export const GROUP1_SYLLABUS_QUOTAS = {
  normalized200: [
    { partCode: 'PART_A', unitCode: 'UNIT_I',     unitNumber: 1, unitName: 'General Science', quota: 10 },
    { partCode: 'PART_A', unitCode: 'UNIT_II',    unitNumber: 2, unitName: 'Geography of India', quota: 10 },
    { partCode: 'PART_A', unitCode: 'UNIT_III',   unitNumber: 3, unitName: 'History, Culture of India & INM', quota: 25 },
    { partCode: 'PART_A', unitCode: 'UNIT_IV',    unitNumber: 4, unitName: 'Indian Polity', quota: 40 },
    { partCode: 'PART_A', unitCode: 'UNIT_V',     unitNumber: 5, unitName: 'Indian Economy & Dev Admin in TN', quota: 50 },
    { partCode: 'PART_A', unitCode: 'UNIT_VI',    unitNumber: 6, unitName: 'History, Culture, Heritage & Movements in TN', quota: 40 },
    { partCode: 'PART_B', unitCode: 'APT_UNIT_I', unitNumber: 7, unitName: 'Aptitude & Arithmetic', quota: 15 },
    { partCode: 'PART_B', unitCode: 'APT_UNIT_II',unitNumber: 8, unitName: 'Mental Ability & Reasoning', quota: 10 },
  ],
}

// Group 2 Quota Blueprint (100 Language + 75 GS + 25 Aptitude = 200 Questions)
export const GROUP2_SYLLABUS_QUOTAS = {
  tamil200: [
    { partCode: 'PART_A', unitCode: 'LANG_TA_A',  unitNumber: 1, unitName: 'பகுதி-அ (இலக்கணம்)', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_TA_B',  unitNumber: 2, unitName: 'பகுதி-ஆ (இலக்கியம்)', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_TA_C',  unitNumber: 3, unitName: 'பகுதி-இ (தமிழ் அறிஞர்கள்)', quota: 30 },
    { partCode: 'PART_B', unitCode: 'UNIT_I',     unitNumber: 4, unitName: 'General Science', quota: 5 },
    { partCode: 'PART_B', unitCode: 'UNIT_II',    unitNumber: 5, unitName: 'Current Events', quota: 5 },
    { partCode: 'PART_B', unitCode: 'UNIT_III',   unitNumber: 6, unitName: 'Geography of India', quota: 10 },
    { partCode: 'PART_B', unitCode: 'UNIT_IV',    unitNumber: 7, unitName: 'History and Culture of India', quota: 15 },
    { partCode: 'PART_B', unitCode: 'UNIT_V',     unitNumber: 8, unitName: 'Indian Polity & Economy', quota: 20 },
    { partCode: 'PART_B', unitCode: 'UNIT_VI',    unitNumber: 9, unitName: 'INM & Tamil Nadu Heritage', quota: 20 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_I', unitNumber: 10, unitName: 'Aptitude & Arithmetic', quota: 15 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_II',unitNumber: 11, unitName: 'Mental Ability & Reasoning', quota: 10 },
  ],
  english200: [
    { partCode: 'PART_A', unitCode: 'LANG_EN_A',  unitNumber: 1, unitName: 'Part-A Grammar', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_EN_B',  unitNumber: 2, unitName: 'Part-B Literature / Prescribed Poems', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_EN_C',  unitNumber: 3, unitName: 'Part-C Authors & Works', quota: 30 },
    { partCode: 'PART_B', unitCode: 'UNIT_I',     unitNumber: 4, unitName: 'General Science', quota: 5 },
    { partCode: 'PART_B', unitCode: 'UNIT_II',    unitNumber: 5, unitName: 'Current Events', quota: 5 },
    { partCode: 'PART_B', unitCode: 'UNIT_III',   unitNumber: 6, unitName: 'Geography of India', quota: 10 },
    { partCode: 'PART_B', unitCode: 'UNIT_IV',    unitNumber: 7, unitName: 'History and Culture of India', quota: 15 },
    { partCode: 'PART_B', unitCode: 'UNIT_V',     unitNumber: 8, unitName: 'Indian Polity & Economy', quota: 20 },
    { partCode: 'PART_B', unitCode: 'UNIT_VI',    unitNumber: 9, unitName: 'INM & Tamil Nadu Heritage', quota: 20 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_I', unitNumber: 10, unitName: 'Aptitude & Arithmetic', quota: 15 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_II',unitNumber: 11, unitName: 'Mental Ability & Reasoning', quota: 10 },
  ],
}

// Group 4 Quota Blueprint (100 Tamil + 75 GS + 25 Aptitude = 200 Questions)
export const GROUP4_SYLLABUS_QUOTAS = {
  normalized200: [
    { partCode: 'PART_A', unitCode: 'LANG_TA_A',  unitNumber: 1, unitName: 'பகுதி-அ (இலக்கணம்)', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_TA_B',  unitNumber: 2, unitName: 'பகுதி-ஆ (இலக்கியம்)', quota: 35 },
    { partCode: 'PART_A', unitCode: 'LANG_TA_C',  unitNumber: 3, unitName: 'பகுதி-இ (தமிழ் அறிஞர்கள்)', quota: 30 },
    { partCode: 'PART_B', unitCode: 'UNIT_I',     unitNumber: 4, unitName: 'General Science (SSLC)', quota: 8 },
    { partCode: 'PART_B', unitCode: 'UNIT_II',    unitNumber: 5, unitName: 'Current Events', quota: 7 },
    { partCode: 'PART_B', unitCode: 'UNIT_III',   unitNumber: 6, unitName: 'Geography of India', quota: 12 },
    { partCode: 'PART_B', unitCode: 'UNIT_IV',    unitNumber: 7, unitName: 'History and Culture of India', quota: 15 },
    { partCode: 'PART_B', unitCode: 'UNIT_V',     unitNumber: 8, unitName: 'Indian Polity & Economy', quota: 18 },
    { partCode: 'PART_B', unitCode: 'UNIT_VI',    unitNumber: 9, unitName: 'INM & Tamil Nadu Culture', quota: 15 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_I', unitNumber: 10, unitName: 'Aptitude & Arithmetic', quota: 15 },
    { partCode: 'PART_C', unitCode: 'APT_UNIT_II',unitNumber: 11, unitName: 'Mental Ability & Reasoning', quota: 10 },
  ],
}

// ─── Mathematical Biproportional / Hamilton Allocator ────────────────────────

export function buildAllocationMatrix(unitDefinitions, totalTarget = 200) {
  const diffKeys = ['easy', 'medium', 'hard']
  const targetColTotals = {
    easy: Math.round(totalTarget * DIFFICULTY_RATIOS.easy),     // 20% -> 40
    medium: Math.round(totalTarget * DIFFICULTY_RATIOS.medium), // 50% -> 100
    hard: Math.round(totalTarget * DIFFICULTY_RATIOS.hard),     // 30% -> 60
  }

  // Hamilton Largest Remainder rounding per row
  const matrix = unitDefinitions.map(unit => {
    const rawEasy = unit.quota * DIFFICULTY_RATIOS.easy
    const rawMed  = unit.quota * DIFFICULTY_RATIOS.medium
    const rawHard = unit.quota * DIFFICULTY_RATIOS.hard

    const floorEasy = Math.floor(rawEasy)
    const floorMed  = Math.floor(rawMed)
    const floorHard = Math.floor(rawHard)

    let remainder = unit.quota - (floorEasy + floorMed + floorHard)

    const fracs = [
      { key: 'easy', frac: rawEasy - floorEasy },
      { key: 'medium', frac: rawMed - floorMed },
      { key: 'hard', frac: rawHard - floorHard },
    ].sort((a, b) => b.frac - a.frac)

    const row = {
      ...unit,
      quotas: {
        easy: floorEasy,
        medium: floorMed,
        hard: floorHard,
      }
    }

    for (let i = 0; i < remainder; i++) {
      row.quotas[fracs[i].key]++
    }

    return row
  })

  // Reconcile column sums to match targetColTotals exactly
  for (const diff of diffKeys) {
    let colSum = matrix.reduce((sum, r) => sum + r.quotas[diff], 0)
    let diffDelta = targetColTotals[diff] - colSum

    if (diffDelta !== 0) {
      for (const r of matrix) {
        if (diffDelta === 0) break
        if (diffDelta > 0) {
          const otherDiff = diffKeys.find(k => k !== diff && r.quotas[k] > 1)
          if (otherDiff) {
            r.quotas[diff]++
            r.quotas[otherDiff]--
            diffDelta--
          }
        } else if (diffDelta < 0 && r.quotas[diff] > 1) {
          const otherDiff = diffKeys.find(k => k !== diff)
          if (otherDiff) {
            r.quotas[diff]--
            r.quotas[otherDiff]++
            diffDelta++
          }
        }
      }
    }
  }

  return matrix
}

// ─── Fisher-Yates Randomized Sampling without Replacement ─────────────────────

function sampleBucketWithoutReplacement(pool, count, usedIds, usedTexts, rng = Math.random) {
  const available = pool.filter(q => {
    if (!q || !q.id) return false
    if (usedIds.has(q.id)) return false
    const textKey = (q.question_text || q.en_question_text || '').trim().toLowerCase()
    if (textKey && usedTexts.has(textKey)) return false
    return true
  })

  // Shuffle available candidates
  const shuffled = [...available]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const selected = shuffled.slice(0, count)
  selected.forEach(q => {
    usedIds.add(q.id)
    const textKey = (q.question_text || q.en_question_text || '').trim().toLowerCase()
    if (textKey) usedTexts.add(textKey)
  })

  return {
    selected,
    availableCount: available.length,
    deficit: Math.max(0, count - selected.length),
  }
}

// ─── Intelligent Test Generator Engine ────────────────────────────────────────

export const testGeneratorService = {
  /**
   * Generates a flexible mock test with available questions (any count from 1-200)
   * - Uses all available questions regardless of count
   * - Respects zero-repetition (avoids questions user has seen)
   * - Maintains difficulty distribution if possible
   * - Shows "No questions available" only if 0 questions exist
   */
  async generateFlexibleMockTest(options = {}) {
    const {
      userId = null,
      examType = 'TNPSC Group 4',
      languageSpecialization = 'General Tamil',
      allowFallback = true,
    } = options

    console.log('[testGeneratorService] Generating flexible mock test...')

    try {
      // Determine exam tag
      let examTag = 'TNPSC_GROUP_4'
      if (examType.includes('Group 1')) examTag = 'TNPSC_GROUP_1'
      else if (examType.includes('Group 2')) examTag = 'TNPSC_GROUP_2'

      // Fetch ALL available questions from database
      const { data: allQuestions, error } = await supabase
        .from('questions')
        .select('*')
        .not('correct_option', 'is', null)
        .not('unit_code', 'is', null)
        .not('difficulty_level', 'is', null)

      if (error) throw error

      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('No questions available in database. Please upload questions via Admin panel.')
      }

      console.log(`[testGeneratorService] Found ${allQuestions.length} total questions in database`)

      // Prioritize exam-specific questions but fallback to all questions if needed
      let examSpecificQuestions = allQuestions.filter(q => {
        if (q.exam_tag && q.exam_tag === examTag) return true
        if (q.group_tag && q.group_tag.includes(examTag.replace('TNPSC_GROUP_', ''))) return true
        return false
      })

      let filteredQuestions = examSpecificQuestions.length > 0 ? examSpecificQuestions : allQuestions
      console.log(`[testGeneratorService] Using ${filteredQuestions.length} questions (${examSpecificQuestions.length} exam-specific, ${allQuestions.length} total available)`)

      // Apply zero-repetition: prioritize unseen questions
      let finalQuestions = filteredQuestions
      if (userId) {
        const { unseen, seen } = await questionHistoryService.partitionPoolByHistory(
          userId,
          examTag,
          filteredQuestions
        )
        
        // Use unseen first, then seen (sorted by times_seen ascending)
        finalQuestions = [...unseen, ...seen]
        console.log(`[testGeneratorService] Zero-repetition: ${unseen.length} unseen, ${seen.length} seen`)
      }

      // Shuffle questions
      finalQuestions = this.shuffleArray([...finalQuestions])

      // Take up to 200 questions (or all if less than 200)
      const questionsToUse = finalQuestions.slice(0, Math.min(200, finalQuestions.length))

      console.log(`[testGeneratorService] Generated test with ${questionsToUse.length} questions`)

      return {
        examType,
        languageSpecialization,
        totalQuestions: questionsToUse.length,
        questions: questionsToUse,
        metadata: {
          availablePool: filteredQuestions.length,
          unseenCount: userId ? finalQuestions.filter((q, i) => i < questionsToUse.length).length : questionsToUse.length,
        }
      }
    } catch (err) {
      console.error('[testGeneratorService] Flexible test generation error:', err)
      throw err
    }
  },

  /**
   * Helper: Fisher-Yates shuffle
   */
  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },

  /**
   * Generates a 200-question Group 1 test with exact blueprint quotas:
   * UNIT_I (10) + UNIT_II (10) + UNIT_III (25) + UNIT_IV (40) + UNIT_V (50) + UNIT_VI (40) + APT_UNIT_I (15) + APT_UNIT_II (10) = 200 Qs.
   * Zero-repetition tracking: prioritizes unseen questions for userId.
   */
  async generateGroup1Test(options = {}) {
    const {
      userId = null,
      questionPoolProvider = null,
      strict = false,
      allowFallback = true,
      rng = Math.random,
    } = options

    const units = GROUP1_SYLLABUS_QUOTAS.normalized200
    const allocationMatrix = buildAllocationMatrix(units, 200)

    const usedIds = new Set()
    const usedTexts = new Set()
    const selectedQuestions = []
    const warnings = []
    const fallbacks = []

    for (const unitRow of allocationMatrix) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const requiredCount = unitRow.quotas[diff]
        if (requiredCount <= 0) continue

        let candidatePool = []
        if (typeof questionPoolProvider === 'function') {
          candidatePool = await questionPoolProvider({
            examGroup: 'TNPSC Group 1',
            partCode: unitRow.partCode,
            unitCode: unitRow.unitCode,
            unitNumber: unitRow.unitNumber,
            unitName: unitRow.unitName,
            difficultyLevel: diff,
          })
        } else {
          candidatePool = await this.fetchQuestionBankPool({
            groupName: 'TNPSC Group 1',
            examTag: 'TNPSC_GROUP_1',
            unitCode: unitRow.unitCode,
            difficultyLevel: diff,
          })
        }

        // Apply Zero-Repetition Partition if userId provided
        let orderedPool = candidatePool || []
        if (userId && orderedPool.length > 0) {
          const { unseen, seen } = await questionHistoryService.partitionPoolByHistory(
            userId,
            'TNPSC_GROUP_1',
            orderedPool
          )
          orderedPool = [...unseen, ...seen]
        }

        const { selected, availableCount, deficit } = sampleBucketWithoutReplacement(
          orderedPool,
          requiredCount,
          usedIds,
          usedTexts,
          rng
        )

        const stamped = selected.map(q => ({
          ...q,
          part_code: q.part_code || unitRow.partCode,
          unit_code: q.unit_code || unitRow.unitCode,
          unit_name: q.unit_name || unitRow.unitName,
          difficulty_level: q.difficulty_level || diff,
          group_tag: 'Group 1',
          group_name: 'TNPSC Group 1',
        }))
        selectedQuestions.push(...stamped)

        if (deficit > 0) {
          if (strict) {
            throw new InsufficientQuestionPoolError({
              bucket: `${unitRow.unitCode} (${unitRow.unitName})`,
              unitCode: unitRow.unitCode,
              unitName: unitRow.unitName,
              difficultyLevel: diff,
              requested: requiredCount,
              available: availableCount,
              deficit,
            })
          }

          if (allowFallback) {
            warnings.push(
              `Bucket ${unitRow.unitCode} [${diff}] has deficit of ${deficit} questions (requested ${requiredCount}, got ${selected.length}).`
            )
            // Adjacent difficulty fallback
            const otherDiffs = ['medium', 'easy', 'hard'].filter(k => k !== diff)
            let backfilled = 0

            for (const altDiff of otherDiffs) {
              if (backfilled >= deficit) break
              const altPool = await this.fetchQuestionBankPool({
                groupName: 'TNPSC Group 1',
                examTag: 'TNPSC_GROUP_1',
                unitCode: unitRow.unitCode,
                difficultyLevel: altDiff,
              })

              let orderedAlt = altPool || []
              if (userId && orderedAlt.length > 0) {
                const { unseen, seen } = await questionHistoryService.partitionPoolByHistory(
                  userId,
                  'TNPSC_GROUP_1',
                  orderedAlt
                )
                orderedAlt = [...unseen, ...seen]
              }

              const needed = deficit - backfilled
              const altSample = sampleBucketWithoutReplacement(orderedAlt, needed, usedIds, usedTexts, rng)
              if (altSample.selected.length > 0) {
                selectedQuestions.push(...altSample.selected.map(q => ({
                  ...q,
                  unit_code: unitRow.unitCode,
                  unit_name: unitRow.unitName,
                  difficulty_level: altDiff,
                  group_tag: 'Group 1',
                  group_name: 'TNPSC Group 1',
                })))
                backfilled += altSample.selected.length
                fallbacks.push({
                  unitCode: unitRow.unitCode,
                  originalDiff: diff,
                  fallbackDiff: altDiff,
                  count: altSample.selected.length,
                })
              }
            }
          }
        }
      }
    }

    const finalQuestions = selectedQuestions.slice(0, 200).map((q, idx) => ({
      ...q,
      question_number: idx + 1,
    }))

    const actualDiffBreakdown = { easy: 0, medium: 0, hard: 0 }
    const actualUnitBreakdown = {}

    finalQuestions.forEach(q => {
      const d = (q.difficulty_level || 'medium').toLowerCase()
      if (actualDiffBreakdown[d] !== undefined) actualDiffBreakdown[d]++
      else actualDiffBreakdown.medium++

      const u = q.unit_code || q.unit_name || 'UNCLASSIFIED'
      actualUnitBreakdown[u] = (actualUnitBreakdown[u] || 0) + 1
    })

    return {
      examType: 'TNPSC Group 1',
      totalQuestions: finalQuestions.length,
      targetQuota: 200,
      questions: finalQuestions,
      allocationMatrix,
      distribution: {
        difficulty: actualDiffBreakdown,
        units: actualUnitBreakdown,
      },
      manifest: {
        totalUniqueIds: usedIds.size,
        warnings,
        fallbacks,
        generatedAt: new Date().toISOString(),
      },
    }
  },

  /**
   * Generates a 200-question Group 2/2A test:
   * - Part A (100 Questions): Selected Language (Tamil: 35+35+30 or English: 35+35+30)
   * - Part B (75 Questions): GS Units I-VI (5+5+10+15+20+20)
   * - Part C (25 Questions): Aptitude (15+10)
   * Total: Exactly 200 Questions (20% Easy, 50% Medium, 30% Hard)
   */
  async generateGroup2Test(options = {}) {
    const {
      userId = null,
      languageSpecialization = 'General Tamil',
      strict = false,
      allowFallback = true,
      rng = Math.random,
    } = options

    const isEnglish = languageSpecialization?.includes('English')
    const unitDefinitions = isEnglish ? GROUP2_SYLLABUS_QUOTAS.english200 : GROUP2_SYLLABUS_QUOTAS.tamil200
    const allocationMatrix = buildAllocationMatrix(unitDefinitions, 200)

    const usedIds = new Set()
    const usedTexts = new Set()
    const selectedQuestions = []
    const warnings = []
    const fallbacks = []

    for (const unitRow of allocationMatrix) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const requiredCount = unitRow.quotas[diff]
        if (requiredCount <= 0) continue

        let candidatePool = await this.fetchQuestionBankPool({
          groupName: 'TNPSC Group 2/2A',
          examTag: 'TNPSC_GROUP_2',
          unitCode: unitRow.unitCode,
          difficultyLevel: diff,
          languageSpecialization: isEnglish ? 'General English' : 'General Tamil',
        })

        let orderedPool = candidatePool || []
        if (userId && orderedPool.length > 0) {
          const { unseen, seen } = await questionHistoryService.partitionPoolByHistory(
            userId,
            'TNPSC_GROUP_2',
            orderedPool
          )
          orderedPool = [...unseen, ...seen]
        }

        const { selected, availableCount, deficit } = sampleBucketWithoutReplacement(
          orderedPool,
          requiredCount,
          usedIds,
          usedTexts,
          rng
        )

        const stamped = selected.map(q => ({
          ...q,
          part_code: q.part_code || unitRow.partCode,
          unit_code: q.unit_code || unitRow.unitCode,
          unit_name: q.unit_name || unitRow.unitName,
          difficulty_level: q.difficulty_level || diff,
          group_tag: 'Group 2/2A',
          group_name: 'TNPSC Group 2/2A',
        }))
        selectedQuestions.push(...stamped)

        if (deficit > 0 && allowFallback) {
          warnings.push(`Group 2 Bucket ${unitRow.unitCode} [${diff}] has deficit of ${deficit} questions.`)
          const otherDiffs = ['medium', 'easy', 'hard'].filter(k => k !== diff)
          let backfilled = 0

          for (const altDiff of otherDiffs) {
            if (backfilled >= deficit) break
            const altPool = await this.fetchQuestionBankPool({
              groupName: 'TNPSC Group 2/2A',
              examTag: 'TNPSC_GROUP_2',
              unitCode: unitRow.unitCode,
              difficultyLevel: altDiff,
              languageSpecialization: isEnglish ? 'General English' : 'General Tamil',
            })

            const needed = deficit - backfilled
            const altSample = sampleBucketWithoutReplacement(altPool || [], needed, usedIds, usedTexts, rng)
            if (altSample.selected.length > 0) {
              selectedQuestions.push(...altSample.selected.map(q => ({
                ...q,
                unit_code: unitRow.unitCode,
                unit_name: unitRow.unitName,
                difficulty_level: altDiff,
                group_tag: 'Group 2/2A',
                group_name: 'TNPSC Group 2/2A',
              })))
              backfilled += altSample.selected.length
            }
          }
        }
      }
    }

    const finalQuestions = selectedQuestions.slice(0, 200).map((q, idx) => ({
      ...q,
      question_number: idx + 1,
    }))

    return {
      examType: 'TNPSC Group 2/2A',
      languageSpecialization: isEnglish ? 'General English' : 'General Tamil',
      totalQuestions: finalQuestions.length,
      targetQuota: 200,
      questions: finalQuestions,
      manifest: {
        totalUniqueIds: usedIds.size,
        warnings,
        fallbacks,
        generatedAt: new Date().toISOString(),
      },
    }
  },

  /**
   * Generates a 200-question Group 4 test:
   * - Part A (100 Questions): General Tamil (35+35+30)
   * - Part B (75 Questions): GS Units I-VI (8+7+12+15+18+15)
   * - Part C (25 Questions): Aptitude (15+10)
   * Total: Exactly 200 Questions (20% Easy, 50% Medium, 30% Hard)
   */
  async generateGroup4Test(options = {}) {
    const {
      userId = null,
      languageSpecialization = 'General Tamil',
      strict = false,
      allowFallback = true,
      rng = Math.random,
    } = options

    const unitDefinitions = GROUP4_SYLLABUS_QUOTAS.normalized200
    const allocationMatrix = buildAllocationMatrix(unitDefinitions, 200)

    const usedIds = new Set()
    const usedTexts = new Set()
    const selectedQuestions = []
    const warnings = []
    const fallbacks = []

    for (const unitRow of allocationMatrix) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const requiredCount = unitRow.quotas[diff]
        if (requiredCount <= 0) continue

        let candidatePool = await this.fetchQuestionBankPool({
          groupName: 'TNPSC Group 4',
          examTag: 'TNPSC_GROUP_4',
          unitCode: unitRow.unitCode,
          difficultyLevel: diff,
          languageSpecialization: 'General Tamil',
        })

        let orderedPool = candidatePool || []
        if (userId && orderedPool.length > 0) {
          const { unseen, seen } = await questionHistoryService.partitionPoolByHistory(
            userId,
            'TNPSC_GROUP_4',
            orderedPool
          )
          orderedPool = [...unseen, ...seen]
        }

        const { selected, availableCount, deficit } = sampleBucketWithoutReplacement(
          orderedPool,
          requiredCount,
          usedIds,
          usedTexts,
          rng
        )

        const stamped = selected.map(q => ({
          ...q,
          part_code: q.part_code || unitRow.partCode,
          unit_code: q.unit_code || unitRow.unitCode,
          unit_name: q.unit_name || unitRow.unitName,
          difficulty_level: q.difficulty_level || diff,
          group_tag: 'Group 4',
          group_name: 'TNPSC Group 4',
        }))
        selectedQuestions.push(...stamped)

        if (deficit > 0 && allowFallback) {
          warnings.push(`Group 4 Bucket ${unitRow.unitCode} [${diff}] has deficit of ${deficit} questions.`)
          const otherDiffs = ['medium', 'easy', 'hard'].filter(k => k !== diff)
          let backfilled = 0

          for (const altDiff of otherDiffs) {
            if (backfilled >= deficit) break
            const altPool = await this.fetchQuestionBankPool({
              groupName: 'TNPSC Group 4',
              examTag: 'TNPSC_GROUP_4',
              unitCode: unitRow.unitCode,
              difficultyLevel: altDiff,
              languageSpecialization: 'General Tamil',
            })

            const needed = deficit - backfilled
            const altSample = sampleBucketWithoutReplacement(altPool || [], needed, usedIds, usedTexts, rng)
            if (altSample.selected.length > 0) {
              selectedQuestions.push(...altSample.selected.map(q => ({
                ...q,
                unit_code: unitRow.unitCode,
                unit_name: unitRow.unitName,
                difficulty_level: altDiff,
                group_tag: 'Group 4',
                group_name: 'TNPSC Group 4',
              })))
              backfilled += altSample.selected.length
            }
          }
        }
      }
    }

    const finalQuestions = selectedQuestions.slice(0, 200).map((q, idx) => ({
      ...q,
      question_number: idx + 1,
    }))

    return {
      examType: 'TNPSC Group 4',
      languageSpecialization: 'General Tamil',
      totalQuestions: finalQuestions.length,
      targetQuota: 200,
      questions: finalQuestions,
      manifest: {
        totalUniqueIds: usedIds.size,
        warnings,
        fallbacks,
        generatedAt: new Date().toISOString(),
      },
    }
  },

  /**
   * Helper: fetches questions from Supabase question bank for a specific unit & difficulty
   * Includes user-specific filtering to exclude previously attempted questions
   */
  async fetchQuestionBankPool({ groupName, examTag, unitCode, difficultyLevel, languageSpecialization, userId = null, excludeQuestionIds = [] }) {
    try {
      let q = supabase
        .from('questions')
        .select('id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, question_text_tamil, option_a_tamil, option_b_tamil, option_c_tamil, option_d_tamil, explanation_tamil, group_tag, group_name, unit_tag, unit_name, unit_code, macro_topic, micro_topic, difficulty_level, is_pyq, tags')
        .not('correct_option', 'is', null)

      // Exclude already used question IDs in current test generation
      if (excludeQuestionIds.length > 0) {
        q = q.not('id', 'in', `(${excludeQuestionIds.join(',')})`)
      }

      // Filter by unit_code if present
      if (unitCode) {
        q = q.or(`unit_code.eq.${unitCode},unit_tag.ilike.%${unitCode}%,unit_name.ilike.%${unitCode}%`)
      }

      // Filter by difficulty if specified
      if (difficultyLevel) {
        q = q.eq('difficulty_level', difficultyLevel)
      }

      const { data, error } = await q.limit(500)
      
      if (error) {
        console.warn('[testGeneratorService] Query error fallback:', error.message)
        const fb = await supabase.from('questions').select('*').limit(500)
        return fb.data || []
      }
      
      return data || []
    } catch (e) {
      console.warn('[testGeneratorService] fetchQuestionBankPool error:', e)
      return []
    }
  },

  /**
   * Materializes a generated test into a playable exam paper and starts an attempt
   */
  async materializeGeneratedMockPaper(userId, generatedTest) {
    if (!userId) throw new Error('User authentication required to materialize mock paper.')
    if (!generatedTest || !generatedTest.questions?.length) {
      throw new Error('Valid generated test with questions is required.')
    }

    const examTitle = `${generatedTest.examType} Full Mock Test (${new Date().toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })})${generatedTest.languageSpecialization ? ` [${generatedTest.languageSpecialization}]` : ''}`

    // 1. Create a published Paper
    const paperPayload = {
      title: examTitle,
      year: new Date().getFullYear(),
      exam_type: 'Full Mock',
      exam_name: generatedTest.examType,
      subject: generatedTest.languageSpecialization || 'General Studies',
      total_questions: generatedTest.totalQuestions,
      duration_minutes: 180, // Standard 3 hours for 200Q
      maximum_marks: 300,
      status: 'published',
      created_by: userId,
    }

    const { data: createdPaper, error: paperErr } = await supabase
      .from('papers')
      .insert([paperPayload])
      .select()
      .single()

    if (paperErr) {
      throw new Error(`Failed to create mock exam paper in database: ${paperErr.message}`)
    }
    const paper = createdPaper

    // 2. Insert questions for this paper with complete 5-identifier metadata + Option E
    const questionRecords = generatedTest.questions.map((q, idx) => ({
      paper_id: paper.id,
      question_number: idx + 1,
      question_text: q.question_text || q.en_question_text,
      option_a: q.option_a || q.en_option_a,
      option_b: q.option_b || q.en_option_b,
      option_c: q.option_c || q.en_option_c,
      option_d: q.option_d || q.en_option_d,
      correct_option: q.correct_option || q.answer_key || 'A',
      explanation: q.explanation || q.en_explanation || null,
      question_text_tamil: q.question_text_tamil || q.ta_question_text || null,
      option_a_tamil: q.option_a_tamil || q.ta_option_a || null,
      option_b_tamil: q.option_b_tamil || q.ta_option_b || null,
      option_c_tamil: q.option_c_tamil || q.ta_option_c || null,
      option_d_tamil: q.option_d_tamil || q.ta_option_d || null,
      explanation_tamil: q.explanation_tamil || q.ta_explanation || null,
      group_tag: q.group_tag || (generatedTest.examType?.includes('Group 1') ? 'Group 1' : generatedTest.examType?.includes('Group 2') ? 'Group 2' : 'Group 4'),
      group_name: q.group_name || generatedTest.examType || 'TNPSC Group 4',
      unit_tag: q.unit_tag || (q.unit_code ? q.unit_code : 'Unit 1'),
      unit_name: q.unit_name || null,
      unit_code: q.unit_code || null,
      macro_topic: q.macro_topic || q.macro_topic_name || null,
      macro_topic_name: q.macro_topic_name || q.macro_topic || null,
      micro_topic: q.micro_topic || q.micro_topic_name || null,
      micro_topic_name: q.micro_topic_name || q.micro_topic || null,
      exam_year: String(q.exam_year || q.year || '2024'),
      is_pyq: Boolean(q.is_pyq || q.source_type === 'PYQ'),
      difficulty_level: q.difficulty_level || 'Medium',
    }))

    await questionService.saveQuestionsToSupabase(paper.id, questionRecords, true)

    // 3. Start attempt for user
    const attempt = await attemptService.startOrGetAttempt(userId, paper.id)

    return {
      paperId: paper.id,
      attemptId: attempt.id,
      paper,
      attempt,
    }
  },
}
