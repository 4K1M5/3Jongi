import type { Book } from '../domain/models'
import { bookManifestSchema, parseBook } from '../domain/schema'

// Assembles validated Books from a flat map of file path -> parsed JSON, the
// shape produced by Vite's `import.meta.glob(..., { eager: true })`. Kept pure
// and framework-free so it is unit-testable; the Nuxt layer supplies the glob.
//
// Convention: content lives at `.../books/<bookId>/book.json` (a { id, title }
// manifest) plus one `.../books/<bookId>/<unit>.json` file per unit. Units are
// ordered by their own id, so a new unit file is picked up without extra wiring.

const MANIFEST_FILENAME = 'book.json'

interface BookFolder {
  manifest: unknown | null
  units: unknown[]
}

function pathSegments(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '' && segment !== '.')
}

/** The folder name directly under `books/`, or null if the path isn't book content. */
function bookIdFromPath(path: string): string | null {
  const segments = pathSegments(path)
  const booksIndex = segments.lastIndexOf('books')
  if (booksIndex === -1 || booksIndex + 2 > segments.length - 1) return null
  return segments[booksIndex + 1] ?? null
}

function filenameOf(path: string): string {
  const segments = pathSegments(path)
  return segments[segments.length - 1] ?? ''
}

function groupByBookFolder(modules: Record<string, unknown>): Map<string, BookFolder> {
  const folders = new Map<string, BookFolder>()
  for (const [path, content] of Object.entries(modules)) {
    const bookId = bookIdFromPath(path)
    if (bookId === null) continue

    const folder = folders.get(bookId) ?? { manifest: null, units: [] }
    if (filenameOf(path) === MANIFEST_FILENAME) folder.manifest = content
    else folder.units.push(content)
    folders.set(bookId, folder)
  }
  return folders
}

function rawUnitId(unit: unknown): string {
  return typeof unit === 'object' && unit !== null && 'id' in unit
    ? String((unit as { id: unknown }).id)
    : ''
}

function assembleBook(bookId: string, folder: BookFolder): Book {
  if (folder.manifest === null) {
    throw new Error(`Book folder "${bookId}" is missing its ${MANIFEST_FILENAME} manifest`)
  }
  if (folder.units.length === 0) {
    throw new Error(`Book folder "${bookId}" has no unit files`)
  }

  const manifest = bookManifestSchema.parse(folder.manifest)
  const units = [...folder.units].sort((a, b) => rawUnitId(a).localeCompare(rawUnitId(b)))

  return parseBook({ id: manifest.id, title: manifest.title, units })
}

export function loadBooksFromModules(modules: Record<string, unknown>): Book[] {
  return [...groupByBookFolder(modules).entries()]
    .map(([bookId, folder]) => assembleBook(bookId, folder))
    .sort((a, b) => a.id.localeCompare(b.id))
}
