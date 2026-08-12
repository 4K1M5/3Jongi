import { ref } from 'vue'
import type { QuizProgress, QuizRef } from '~~/core/domain/models'
import type { QuizResult } from '~~/core/domain/quiz'
import { createInitialProgress, recordAttempt } from '~~/core/domain/progress'

/** Reactive read/write of a single quiz's stored progress. */
export function useQuizProgress(quizRef: QuizRef) {
  const { progress: progressRepository } = useRepositories()
  const progress = ref<QuizProgress>(createInitialProgress(quizRef))

  async function load(): Promise<void> {
    const stored = await progressRepository.getQuizProgress(quizRef)
    if (stored) progress.value = stored
  }

  async function record(result: QuizResult): Promise<void> {
    const next = recordAttempt(progress.value, result, new Date().toISOString())
    await progressRepository.saveQuizProgress(next)
    progress.value = next
  }

  return { progress, load, record }
}
