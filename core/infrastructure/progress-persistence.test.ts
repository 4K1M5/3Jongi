import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Quiz, QuizRef } from '../domain/models'
import { answerAndAdvance, createQuizSession, scoreQuiz } from '../domain/quiz'
import { createInitialProgress, recordAttempt } from '../domain/progress'
import { LocalStorageProgressRepository } from './local-storage-progress-repository'

// Integration test for the persistence path a learner actually exercises:
// finish a quiz -> score -> record -> save, then reload (a brand-new repository
// reading the same storage) and confirm progress survived.

class MemoryStorage {
  private store = new Map<string, string>()
  get length(): number { return this.store.size }
  getItem(key: string): string | null { return this.store.get(key) ?? null }
  setItem(key: string, value: string): void { this.store.set(key, value) }
  removeItem(key: string): void { this.store.delete(key) }
  clear(): void { this.store.clear() }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null }
}

const ref: QuizRef = { bookId: 'sample', unitId: 'unit-01', quizId: 'set-1' }

const quiz: Quiz = {
  id: 'set-1',
  title: 'Set 1',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice-meaning',
      prompt: '물',
      choices: [
        { id: 'c1', label: 'water' },
        { id: 'c2', label: 'fire' },
      ],
      correctChoiceId: 'c1',
    },
    {
      id: 'q2',
      type: 'multiple-choice-meaning',
      prompt: '책',
      choices: [
        { id: 'c1', label: 'book' },
        { id: 'c2', label: 'door' },
      ],
      correctChoiceId: 'c1',
    },
  ],
}

/** Plays the quiz, answering each question with the given choiceId. */
function play(answers: Record<string, string>) {
  let session = createQuizSession(quiz)
  for (const question of quiz.questions) {
    session = answerAndAdvance(session, question.id, answers[question.id]!)
  }
  return scoreQuiz(session)
}

describe('progress persistence across a reload', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists a completed quiz and reads it back from a fresh repository', async () => {
    const perfect = play({ q1: 'c1', q2: 'c1' })
    const saved = recordAttempt(createInitialProgress(ref), perfect, '2026-01-01T00:00:00.000Z')
    await new LocalStorageProgressRepository().saveQuizProgress(saved)

    // Reload: a new repository instance reading the same underlying storage.
    const afterReload = await new LocalStorageProgressRepository().getQuizProgress(ref)

    expect(afterReload).toEqual({
      ...ref,
      attempts: 1,
      bestScore: 1,
      completedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('keeps the best score when a later, weaker attempt is played and reloaded', async () => {
    const repository = new LocalStorageProgressRepository()

    const perfect = play({ q1: 'c1', q2: 'c1' })
    await repository.saveQuizProgress(
      recordAttempt(createInitialProgress(ref), perfect, '2026-01-01T00:00:00.000Z'),
    )

    const previous = (await new LocalStorageProgressRepository().getQuizProgress(ref))!
    const weaker = play({ q1: 'c1', q2: 'c2' }) // second answer wrong -> 0.5
    await repository.saveQuizProgress(recordAttempt(previous, weaker, '2026-02-02T00:00:00.000Z'))

    const afterReload = await new LocalStorageProgressRepository().getQuizProgress(ref)
    expect(afterReload?.attempts).toBe(2)
    expect(afterReload?.bestScore).toBe(1) // best retained across reloads
    expect(afterReload?.completedAt).toBe('2026-01-01T00:00:00.000Z')
  })
})
