import test from 'node:test'
import assert from 'node:assert/strict'

import {
  testGeneratorService,
  buildAllocationMatrix,
  GROUP1_SYLLABUS_QUOTAS,
  InsufficientQuestionPoolError,
  sampleBucketWithoutReplacement,
} from '../testGeneratorService.js'

// ─── Test Helper: Mock Question Pool Generator ───────────────────────────────

function createMockQuestionPool({ unitCode, difficultyLevel, count = 100, prefix = '' }) {
  const list = []
  for (let i = 1; i <= count; i++) {
    list.push({
      id: `q-${unitCode}-${difficultyLevel}-${prefix}${i}`,
      question_number: i,
      question_text: `Question ${prefix}${i} for unit ${unitCode} at difficulty ${difficultyLevel}`,
      option_a: 'Option A text',
      option_b: 'Option B text',
      option_c: 'Option C text',
      option_d: 'Option D text',
      correct_option: ['A', 'B', 'C', 'D'][i % 4],
      difficulty_level: difficultyLevel,
      unit_code: unitCode,
      tags: [unitCode, difficultyLevel],
    })
  }
  return list
}

// ─── Suite 1: Mathematical Allocation Matrix ─────────────────────────────────

test('Allocation Matrix: Group 1 200Q exact integer distribution', () => {
  const matrix = buildAllocationMatrix(GROUP1_SYLLABUS_QUOTAS.normalized200, 200)

  // 1. Total row sums must equal unit quotas
  let totalEasy = 0
  let totalMed = 0
  let totalHard = 0
  let totalQuestions = 0

  matrix.forEach(row => {
    const rowSum = row.quotas.easy + row.quotas.medium + row.quotas.hard
    assert.strictEqual(rowSum, row.quota, `Row sum for ${row.unitCode} must match its quota ${row.quota}`)
    totalEasy += row.quotas.easy
    totalMed += row.quotas.medium
    totalHard += row.quotas.hard
    totalQuestions += rowSum
  })

  // 2. Total questions must be exactly 200
  assert.strictEqual(totalQuestions, 200, 'Total questions across all units must be exactly 200')

  // 3. Overall difficulty proportions must match 30% (60), 50% (100), 20% (40)
  assert.strictEqual(totalEasy, 60, 'Easy questions must total exactly 60 (30%)')
  assert.strictEqual(totalMed, 100, 'Medium questions must total exactly 100 (50%)')
  assert.strictEqual(totalHard, 40, 'Hard questions must total exactly 40 (20%)')
})

// ─── Suite 2: Group 1 Test Generation ────────────────────────────────────────

test('Group 1: Generates 200 questions strictly respecting unit quotas and 30/50/20 difficulty', async () => {
  // Provider supplies 150 questions per (unit, diff) bucket
  const mockProvider = async ({ unitCode, difficultyLevel }) => {
    return createMockQuestionPool({ unitCode, difficultyLevel, count: 120 })
  }

  const result = await testGeneratorService.generateGroup1Test({
    quotaResolutionMode: 'normalize_to_200',
    questionPoolProvider: mockProvider,
    strict: true,
  })

  // 1. Total count
  assert.strictEqual(result.totalQuestions, 200)
  assert.strictEqual(result.questions.length, 200)

  // 2. Exact difficulty distribution across the entire paper
  assert.strictEqual(result.distribution.difficulty.easy, 60, 'Easy must be 60')
  assert.strictEqual(result.distribution.difficulty.medium, 100, 'Medium must be 100')
  assert.strictEqual(result.distribution.difficulty.hard, 40, 'Hard must be 40')

  // 3. Unit quota verification
  const expectedQuotas = {
    PART_A_U1: 10,
    PART_A_U2: 10,
    PART_A_U3: 25,
    PART_A_U4: 40,
    PART_A_U5: 45,
    PART_A_U6: 45,
    PART_B_U1: 15,
    PART_B_U2: 10,
  }

  for (const [code, expected] of Object.entries(expectedQuotas)) {
    assert.strictEqual(
      result.distribution.units[code],
      expected,
      `Unit ${code} count must be exactly ${expected}`
    )
  }

  // 4. Deduplication guarantee: zero duplicate IDs or texts
  const seenIds = new Set()
  const seenTexts = new Set()

  result.questions.forEach((q, idx) => {
    assert.strictEqual(q.question_number, idx + 1, 'Questions must be numbered sequentially from 1 to 200')
    assert.ok(!seenIds.has(q.id), `Duplicate question ID detected: ${q.id}`)
    assert.ok(!seenTexts.has(q.question_text), `Duplicate question text detected: ${q.question_text}`)
    seenIds.add(q.id)
    seenTexts.add(q.question_text)
  })

  assert.strictEqual(seenIds.size, 200)
})

// ─── Suite 3: Group 2 Language Specialization ────────────────────────────────

test('Group 2: Specialization with General English (100 English + 100 GS/Aptitude)', async () => {
  const mockProvider = async ({ unitCode, difficultyLevel, languageSpecialization }) => {
    return createMockQuestionPool({ unitCode, difficultyLevel, count: 150 })
  }

  const result = await testGeneratorService.generateGroup2Test({
    languageSpecialization: 'General English',
    questionPoolProvider: mockProvider,
    strict: true,
  })

  assert.strictEqual(result.totalQuestions, 200)
  assert.strictEqual(result.languageSpecialization, 'General English')

  // Part 1: exactly 100 questions from LANG_EN
  assert.strictEqual(result.distribution.parts.PART_1, 100)
  assert.strictEqual(result.distribution.parts.PART_2, 100)

  // Overall difficulty: 60 Easy, 100 Medium, 40 Hard
  assert.strictEqual(result.distribution.difficulty.easy, 60)
  assert.strictEqual(result.distribution.difficulty.medium, 100)
  assert.strictEqual(result.distribution.difficulty.hard, 40)

  // Verify Part 1 questions are all General English
  const part1Qs = result.questions.slice(0, 100)
  part1Qs.forEach(q => {
    assert.strictEqual(q.part_code, 'PART_1')
    assert.strictEqual(q.unit_code, 'LANG_EN')
  })

  // Deduplication check
  const seenIds = new Set(result.questions.map(q => q.id))
  assert.strictEqual(seenIds.size, 200)
})

test('Group 2: Specialization with General Tamil (100 Tamil + 100 GS/Aptitude)', async () => {
  const mockProvider = async ({ unitCode, difficultyLevel }) => {
    return createMockQuestionPool({ unitCode, difficultyLevel, count: 150 })
  }

  const result = await testGeneratorService.generateGroup2Test({
    languageSpecialization: 'General Tamil',
    questionPoolProvider: mockProvider,
    strict: true,
  })

  assert.strictEqual(result.totalQuestions, 200)
  assert.strictEqual(result.languageSpecialization, 'General Tamil')

  const part1Qs = result.questions.slice(0, 100)
  part1Qs.forEach(q => {
    assert.strictEqual(q.part_code, 'PART_1')
    assert.strictEqual(q.unit_code, 'LANG_TA')
  })
})

// ─── Suite 4: Strict Mode & Insufficient Pool Handling ────────────────────────

test('Validation: Strict mode throws InsufficientQuestionPoolError when bucket runs out of questions', async () => {
  // Mock provider returns only 1 question for PART_A_U1 easy (requires 2)
  const deficientProvider = async ({ unitCode, difficultyLevel }) => {
    if (unitCode === 'PART_A_U1' && difficultyLevel === 'easy') {
      return createMockQuestionPool({ unitCode, difficultyLevel, count: 1 })
    }
    return createMockQuestionPool({ unitCode, difficultyLevel, count: 50 })
  }

  await assert.rejects(
    async () => {
      await testGeneratorService.generateGroup1Test({
        questionPoolProvider: deficientProvider,
        strict: true,
        allowFallback: false,
      })
    },
    (err) => {
      assert.ok(err instanceof InsufficientQuestionPoolError, 'Must be instance of InsufficientQuestionPoolError')
      assert.strictEqual(err.details.unitCode, 'PART_A_U1')
      assert.strictEqual(err.details.difficultyLevel, 'easy')
      assert.strictEqual(err.details.requested, 2)
      assert.strictEqual(err.details.available, 1)
      assert.strictEqual(err.details.deficit, 1)
      return true
    }
  )
})

// ─── Suite 5: Graceful Fallback Mode ──────────────────────────────────────────

test('Fallback: Gracefully backfills deficit with adjacent difficulty and synthetic templates without throwing', async () => {
  // Mock provider returns 0 questions for all buckets (empty database simulation)
  const emptyProvider = async () => []

  const result = await testGeneratorService.generateGroup1Test({
    questionPoolProvider: emptyProvider,
    strict: false,
    allowFallback: true,
  })

  assert.strictEqual(result.totalQuestions, 200, 'Must produce full 200 question test even when DB pool is empty')
  assert.ok(result.manifest.fallbacks.length > 0, 'Must record fallbacks in manifest')
  assert.ok(result.manifest.warnings.length > 0, 'Must record warnings in manifest')

  // Verify all 200 generated questions have required fields
  result.questions.forEach((q, idx) => {
    assert.strictEqual(q.question_number, idx + 1)
    assert.ok(q.question_text)
    assert.ok(q.option_a)
    assert.ok(q.option_b)
    assert.ok(q.option_c)
    assert.ok(q.option_d)
    assert.ok(q.correct_option)
  })
})
