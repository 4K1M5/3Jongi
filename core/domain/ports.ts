import type { Unit, UnitProgress } from './models'

/**
 * Read access to quiz content. A bundled/static implementation backs the
 * GitHub Pages build today; an HTTP implementation can back a real backend
 * later without changing any caller.
 */
export interface ContentRepository {
  listUnits(): Promise<Unit[]>
  getUnit(id: string): Promise<Unit | null>
}

/**
 * Persistence for learner progress. A localStorage implementation is used
 * today; a backend/database implementation can replace it behind this same
 * interface.
 */
export interface ProgressRepository {
  getUnitProgress(unitId: string): Promise<UnitProgress | null>
  saveUnitProgress(progress: UnitProgress): Promise<void>
}
