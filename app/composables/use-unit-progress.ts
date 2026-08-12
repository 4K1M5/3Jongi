import { ref } from 'vue'
import type { UnitProgress } from '~~/core/domain/models'
import type { QuizResult } from '~~/core/domain/quiz'
import { createInitialProgress, recordAttempt } from '~~/core/domain/progress'

/** Reactive read/write of a single unit's stored progress. */
export function useUnitProgress(unitId: string) {
  const { progress: progressRepository } = useRepositories()
  const progress = ref<UnitProgress>(createInitialProgress(unitId))

  async function load(): Promise<void> {
    const stored = await progressRepository.getUnitProgress(unitId)
    if (stored) progress.value = stored
  }

  async function record(result: QuizResult): Promise<void> {
    const next = recordAttempt(progress.value, result, new Date().toISOString())
    await progressRepository.saveUnitProgress(next)
    progress.value = next
  }

  return { progress, load, record }
}
