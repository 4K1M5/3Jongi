import type { QuizProgress, QuizRef } from './models'
import type { QuizResult } from './quiz'

export function createInitialProgress(ref: QuizRef): QuizProgress {
  return { ...ref, attempts: 0, bestScore: 0, completedAt: null }
}

/**
 * Folds a finished quiz result into existing progress: bumps the attempt count,
 * keeps the best score, and stamps the first completion time.
 *
 * @param completedAt ISO timestamp supplied by the caller, so this stays pure and testable.
 */
export function recordAttempt(
  previous: QuizProgress,
  result: QuizResult,
  completedAt: string,
): QuizProgress {
  return {
    bookId: previous.bookId,
    unitId: previous.unitId,
    quizId: previous.quizId,
    attempts: previous.attempts + 1,
    bestScore: Math.max(previous.bestScore, result.score),
    completedAt: previous.completedAt ?? completedAt,
  }
}
