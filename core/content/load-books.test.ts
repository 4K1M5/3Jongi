import { describe, expect, it } from 'vitest'
import { loadBooksFromModules } from './load-books'

function question(id: string, correctChoiceId: string) {
  return {
    type: 'multiple-choice-meaning',
    id,
    prompt: 'x',
    choices: [
      { id: 'c1', label: 'a' },
      { id: 'c2', label: 'b' },
    ],
    correctChoiceId,
  }
}

function unit(id: string) {
  return {
    id,
    title: id,
    quizzes: [{ id: 'z1', title: 'Z', questions: [question('q1', 'c1')] }],
  }
}

describe('loadBooksFromModules', () => {
  it('assembles a book from its manifest and unit files, ordered by unit id', () => {
    const books = loadBooksFromModules({
      'books/sample/book.json': { id: 'sample', title: 'Sample Book' },
      'books/sample/unit-02.json': unit('unit-02'),
      'books/sample/unit-01.json': unit('unit-01'),
    })

    expect(books).toHaveLength(1)
    expect(books[0]!.id).toBe('sample')
    expect(books[0]!.title).toBe('Sample Book')
    expect(books[0]!.units.map((u) => u.id)).toEqual(['unit-01', 'unit-02'])
  })

  it('assembles multiple books, ordered by book id', () => {
    const books = loadBooksFromModules({
      'books/b/book.json': { id: 'b', title: 'B' },
      'books/b/unit-01.json': unit('unit-01'),
      'books/a/book.json': { id: 'a', title: 'A' },
      'books/a/unit-01.json': unit('unit-01'),
    })

    expect(books.map((b) => b.id)).toEqual(['a', 'b'])
  })

  it('throws when a book folder has no book.json manifest', () => {
    expect(() =>
      loadBooksFromModules({ 'books/sample/unit-01.json': unit('unit-01') }),
    ).toThrow(/book\.json/i)
  })

  it('throws when a book folder has no unit files', () => {
    expect(() =>
      loadBooksFromModules({ 'books/sample/book.json': { id: 'sample', title: 'S' } }),
    ).toThrow(/unit/i)
  })

  it('surfaces semantic content errors with a path (bad correctChoiceId)', () => {
    const brokenUnit = {
      id: 'unit-01',
      title: 'u',
      quizzes: [{ id: 'z1', title: 'Z', questions: [question('q1', 'nope')] }],
    }
    expect(() =>
      loadBooksFromModules({
        'books/sample/book.json': { id: 'sample', title: 'S' },
        'books/sample/unit-01.json': brokenUnit,
      }),
    ).toThrow(/correctChoiceId/i)
  })
})
