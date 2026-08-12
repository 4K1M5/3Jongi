import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizProgress, QuizRef } from '../domain/models'
import { LocalStorageProgressRepository } from './local-storage-progress-repository'

/** Minimal in-memory Storage double so the adapter can be tested without a browser. */
class MemoryStorage {
  private store = new Map<string, string>()
  get length(): number { return this.store.size }
  getItem(key: string): string | null { return this.store.get(key) ?? null }
  setItem(key: string, value: string): void { this.store.set(key, value) }
  removeItem(key: string): void { this.store.delete(key) }
  clear(): void { this.store.clear() }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null }
}

const ref: QuizRef = { bookId: 'b1', unitId: 'u1', quizId: 'z1' }
const progress: QuizProgress = {
  ...ref,
  attempts: 2,
  bestScore: 0.8,
  completedAt: '2026-01-01T00:00:00.000Z',
}

describe('LocalStorageProgressRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns null for a quiz that has no stored progress', async () => {
    const repository = new LocalStorageProgressRepository()
    expect(await repository.getQuizProgress(ref)).toBeNull()
  })

  it('round-trips saved progress under a book/unit/quiz key', async () => {
    const repository = new LocalStorageProgressRepository()
    await repository.saveQuizProgress(progress)
    expect(await repository.getQuizProgress(ref)).toEqual(progress)
  })

  it('scopes progress by the full book/unit/quiz key', async () => {
    const repository = new LocalStorageProgressRepository()
    await repository.saveQuizProgress(progress)
    expect(await repository.getQuizProgress({ ...ref, quizId: 'other' })).toBeNull()
  })

  it('discards a corrupt entry and logs, rather than throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('3jongi:v1:progress:b1:u1:z1', '{ not valid json')

    const repository = new LocalStorageProgressRepository()
    expect(await repository.getQuizProgress(ref)).toBeNull()
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('degrades to null when storage is unavailable, without throwing', async () => {
    vi.stubGlobal('localStorage', undefined)
    const repository = new LocalStorageProgressRepository()

    await expect(repository.getQuizProgress(ref)).resolves.toBeNull()
    await expect(repository.saveQuizProgress(progress)).resolves.toBeUndefined()
  })
})
