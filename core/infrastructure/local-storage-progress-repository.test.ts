import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UnitProgress } from '../domain/models'
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

const progress: UnitProgress = {
  unitId: 'u1',
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

  it('returns null for a unit that has no stored progress', async () => {
    const repository = new LocalStorageProgressRepository()
    expect(await repository.getUnitProgress('u1')).toBeNull()
  })

  it('round-trips saved progress', async () => {
    const repository = new LocalStorageProgressRepository()
    await repository.saveUnitProgress(progress)
    expect(await repository.getUnitProgress('u1')).toEqual(progress)
  })

  it('discards a corrupt entry and logs, rather than throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('3jongi:v1:progress:u1', '{ not valid json')

    const repository = new LocalStorageProgressRepository()
    expect(await repository.getUnitProgress('u1')).toBeNull()
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('degrades to null when storage is unavailable, without throwing', async () => {
    vi.stubGlobal('localStorage', undefined)
    const repository = new LocalStorageProgressRepository()

    await expect(repository.getUnitProgress('u1')).resolves.toBeNull()
    await expect(repository.saveUnitProgress(progress)).resolves.toBeUndefined()
  })
})
