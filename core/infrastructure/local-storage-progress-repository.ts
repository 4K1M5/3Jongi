import type { UnitProgress } from '../domain/models'
import type { ProgressRepository } from '../domain/ports'

const STORAGE_VERSION = 'v1'
const PROGRESS_KEY_PREFIX = `3jongi:${STORAGE_VERSION}:progress:`

function progressKey(unitId: string): string {
  return `${PROGRESS_KEY_PREFIX}${unitId}`
}

/**
 * Persists progress in the browser's localStorage. On the server (prerender) or
 * when storage is unavailable/blocked, reads return null and writes no-op — so
 * the app degrades to "progress not saved" rather than crashing.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  getUnitProgress(unitId: string): Promise<UnitProgress | null> {
    const raw = this.read(progressKey(unitId))
    if (raw === null) return Promise.resolve(null)
    try {
      return Promise.resolve(JSON.parse(raw) as UnitProgress)
    } catch (error) {
      console.error(`[progress] discarding corrupt entry for unit "${unitId}"`, error)
      return Promise.resolve(null)
    }
  }

  saveUnitProgress(progress: UnitProgress): Promise<void> {
    this.write(progressKey(progress.unitId), JSON.stringify(progress))
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
