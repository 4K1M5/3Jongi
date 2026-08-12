import type { Book } from '~~/core/domain/models'
import { loadBooksFromModules } from '~~/core/content/load-books'

// Nuxt/Vite glob is the only framework-specific step: it eagerly bundles every
// content JSON file. Assembly + validation is the pure, tested core function.
// A malformed content file therefore fails the build here, not silently at runtime.
const contentModules = import.meta.glob('../../core/content/books/**/*.json', {
  eager: true,
  import: 'default',
})

let books: Book[] | undefined

/** Validated, assembled books from the bundled content JSON. Memoized. */
export function loadBooks(): Book[] {
  books ??= loadBooksFromModules(contentModules as Record<string, unknown>)
  return books
}
