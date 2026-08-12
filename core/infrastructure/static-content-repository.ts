import type { Unit } from '../domain/models'
import type { ContentRepository } from '../domain/ports'

/** Serves quiz content from an in-memory, bundled list — the static-build source. */
export class StaticContentRepository implements ContentRepository {
  constructor(private readonly units: readonly Unit[]) {}

  listUnits(): Promise<Unit[]> {
    return Promise.resolve([...this.units])
  }

  getUnit(id: string): Promise<Unit | null> {
    return Promise.resolve(this.units.find((unit) => unit.id === id) ?? null)
  }
}
