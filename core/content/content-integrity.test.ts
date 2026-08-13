import { describe, expect, it } from 'vitest'
import { loadBooksFromModules } from './load-books'
import { findQuestionQualityIssues } from './question-quality'

// Validates the REAL content files that ship in this repo. This is the content
// gate: `npm test` (and therefore CI, before `generate`) fails here if any
// book/unit/quiz JSON is malformed. `npm run validate:content` runs just this
// file for a quick check after generating new content.
const contentModules = import.meta.glob('./books/**/*.json', {
  eager: true,
  import: 'default',
})

describe('shipped content', () => {
  it('loads and validates without throwing', () => {
    expect(() => loadBooksFromModules(contentModules as Record<string, unknown>)).not.toThrow()
  })

  it('has at least one book with units and quizzes', () => {
    const books = loadBooksFromModules(contentModules as Record<string, unknown>)
    expect(books.length).toBeGreaterThan(0)
    for (const book of books) {
      expect(book.units.length).toBeGreaterThan(0)
      for (const unit of book.units) {
        expect(unit.quizzes.length).toBeGreaterThan(0)
        for (const quiz of unit.quizzes) {
          expect(quiz.questions.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('has no content-quality issues the schema cannot catch', () => {
    const books = loadBooksFromModules(contentModules as Record<string, unknown>)
    const issues = findQuestionQualityIssues(books)
    // Mapped to strings so a failure names the exact question and rule.
    expect(issues.map((issue) => `${issue.path} [${issue.rule}] ${issue.message}`)).toEqual([])
  })
})
