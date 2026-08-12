import type { QuizProgress, QuizRef } from '../domain/models'
import type { ProgressRepository } from '../domain/ports'

const STORAGE_VERSION = 'v1'
const PROGRESS_KEY_PREFIX = `3jongi:${STORAGE_VERSION}:progress:`

function progressKey(ref: QuizRef): string {
  return `${PROGRESS_KEY_PREFIX}${ref.bookId}:${ref.unitId}:${ref.quizId}`
}

/**
 * Persists progress in the browser's localStorage. On the server (prerender) or
 * when storage is unavailable/blocked, reads return null and writes no-op — so
 * the app degrades to "progress not saved" rather than crashing.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  getQuizProgress(ref: QuizRef): Promise<QuizProgress | null> {
    const raw = this.read(progressKey(ref))
    if (raw === null) return Promise.resolve(null)
    try {
      return Promise.resolve(JSON.parse(raw) as QuizProgress)
    } catch (error) {
      console.error(
        `[progress] discarding corrupt entry for quiz "${ref.bookId}/${ref.unitId}/${ref.quizId}"`,
        error,
      )
      return Promise.resolve(null)
    }
  }

  saveQuizProgress(progress: QuizProgress): Promise<void> {
    this.write(progressKey(progress), JSON.stringify(progress))
    return Promise.resolve()
  }

  private isAvailable(): boolean {
    return typeof localStorage !== 'undefined'
  }

  private read(key: string): string | null {
    if (!this.isAvailable()) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`[progress] failed to read key "${key}"`, error)
      return null
    }
  }

  private write(key: string, value: string): void {
    if (!this.isAvailable()) return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error(`[progress] failed to write key "${key}"`, error)
    }
  }
}
