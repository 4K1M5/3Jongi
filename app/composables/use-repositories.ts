import type { ContentRepository, ProgressRepository } from '~~/core/domain/ports'
import { StaticContentRepository } from '~~/core/infrastructure/static-content-repository'
import { LocalStorageProgressRepository } from '~~/core/infrastructure/local-storage-progress-repository'
import { loadBooks } from '~/utils/load-content'

// Single composition point where concrete adapters are chosen. To move to a
// backend later, swap these two implementations for HTTP-based ones — nothing
// else in the app changes.
let contentRepository: ContentRepository | undefined
let progressRepository: ProgressRepository | undefined

export function useRepositories(): {
  content: ContentRepository
  progress: ProgressRepository
} {
  contentRepository ??= new StaticContentRepository(loadBooks())
  progressRepository ??= new LocalStorageProgressRepository()
  return { content: contentRepository, progress: progressRepository }
}
