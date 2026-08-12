import { describe, expect, it } from 'vitest'
import type { QuizRef } from './models'
import { createInitialProgress, recordAttempt } from './progress'
import type { QuizResult } from './quiz'

const ref: QuizRef = { bookId: 'b1', unitId: 'u1', quizId: 'z1' }
const perfect: QuizResult = { total: 5, correct: 5, score: 1 }
const half: QuizResult = { total: 5, correct: 3, score: 0.6 }

describe('createInitialProgress', () => {
  it('starts with no attempts and no completion, keyed by book/unit/quiz', () => {
    expect(createInitialProgress(ref)).toEqual({
      bookId: 'b1',
      unitId: 'u1',
      quizId: 'z1',
      attempts: 0,
      bestScore: 0,
      completedAt: null,
    })
  })
})

describe('recordAttempt', () => {
  it('increments attempts and stamps the first completion time', () => {
    const first = recordAttempt(createInitialProgress(ref), half, '2026-01-01T00:00:00.000Z')
    expect(first.attempts).toBe(1)
    expect(first.bestScore).toBe(0.6)
    expect(first.completedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('keeps the best score and the original completion time across attempts', () => {
    const first = recordAttempt(createInitialProgress(ref), perfect, '2026-01-01T00:00:00.000Z')
    const second = recordAttempt(first, half, '2026-02-02T00:00:00.000Z')

    expect(second.attempts).toBe(2)
    expect(second.bestScore).toBe(1) // best is retained, not overwritten by the lower score
    expect(second.completedAt).toBe('2026-01-01T00:00:00.000Z') // first completion preserved
  })
})
