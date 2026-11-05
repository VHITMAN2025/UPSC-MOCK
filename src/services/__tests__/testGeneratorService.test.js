import test from 'node:test'
import assert from 'node:assert/strict'
import {
  testGeneratorService,
  buildAllocationMatrix,
  GROUP1_SYLLABUS_QUOTAS,
  InsufficientQuestionPoolError,
  sampleBucketWithoutReplacement,
} from '../testGeneratorService.js'

const makeQuestions = ({ unitCode, difficultyLevel, count = 50 }) => Array.from({ length: count }, (_, index) => ({
  id: `${unitCode}-${difficultyLevel}-${index + 1}`,
  question_text: `${unitCode} ${difficultyLevel} question ${index + 1}`,
  correct_option: 'A',
  difficulty_level: difficultyLevel,
  unit_code: unitCode,
}))

test('Group 1 blueprint is exactly 200 questions with official quotas and 20/50/30 difficulty', () => {
  const matrix = buildAllocationMatrix(GROUP1_SYLLABUS_QUOTAS.normalized200, 200)
  assert.equal(matrix.reduce((sum, row) => sum + row.quota, 0), 200)
  assert.equal(matrix.reduce((sum, row) => sum + row.quotas.easy, 0), 40)
  assert.equal(matrix.reduce((sum, row) => sum + row.quotas.medium, 0), 100)
  assert.equal(matrix.reduce((sum, row) => sum + row.quotas.hard, 0), 60)
  assert.deepEqual(Object.fromEntries(matrix.map(row => [row.unitCode, row.quota])), {
    UNIT_I: 10, UNIT_II: 10, UNIT_III: 25, UNIT_IV: 40, UNIT_V: 50, UNIT_VI: 40, APT_UNIT_I: 15, APT_UNIT_II: 10,
  })
})

test('Group 1 generator never duplicates questions and honors each verified bucket', async () => {
  const result = await testGeneratorService.generateGroup1Test({
    strict: true,
    questionPoolProvider: ({ unitCode, difficultyLevel }) => makeQuestions({ unitCode, difficultyLevel }),
  })
  assert.equal(result.questions.length, 200)
  assert.equal(new Set(result.questions.map(q => q.id)).size, 200)
  assert.equal(result.distribution.difficulty.easy, 40)
  assert.equal(result.distribution.difficulty.medium, 100)
  assert.equal(result.distribution.difficulty.hard, 60)
  assert.equal(result.distribution.units.UNIT_V, 50)
})

test('insufficient inventory is surfaced instead of silently substituting another subject', async () => {
  await assert.rejects(
    () => testGeneratorService.generateGroup1Test({
      strict: true,
      questionPoolProvider: ({ unitCode, difficultyLevel }) => makeQuestions({ unitCode, difficultyLevel, count: unitCode === 'UNIT_IV' && difficultyLevel === 'hard' ? 1 : 50 }),
    }),
    error => error instanceof InsufficientQuestionPoolError && error.details.unitCode === 'UNIT_IV',
  )
})

test('sampling is de-duplicated by both id and question text', () => {
  const usedIds = new Set()
  const usedTexts = new Set()
  const result = sampleBucketWithoutReplacement([
    { id: 'one', question_text: 'Duplicate text' },
    { id: 'two', question_text: 'Duplicate text' },
    { id: 'three', question_text: 'Unique text' },
  ], 3, usedIds, usedTexts, () => 0)
  assert.equal(result.selected.length, 2)
  assert.equal(result.deficit, 1)
})
