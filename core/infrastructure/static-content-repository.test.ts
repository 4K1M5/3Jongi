import { describe, expect, it } from 'vitest'
import type { Book } from '../domain/models'
import { StaticContentRepository } from './static-content-repository'

const book: Book = {
  id: 'book-1',
  title: 'Book One',
  units: [
    {
      id: 'unit-01',
      title: 'Unit One',
      quizzes: [
        {
          id: 'quiz-1',
          title: 'Quiz One',
          questions: [
            {
              type: 'multiple-choice-meaning',
              id: 'q1',
              prompt: '물',
              choices: [
                { id: 'c1', label: 'water' },
                { id: 'c2', label: 'fire' },
              ],
              correctChoiceId: 'c1',
            },
          ],
        },
      ],
    },
  ],
}

describe('StaticContentRepository', () => {
  const repository = new StaticContentRepository([book])

  it('lists all books', async () => {
    expect(await repository.listBooks()).toEqual([book])
  })

  it('gets a book by id, or null when missing', async () => {
    expect(await repository.getBook('book-1')).toEqual(book)
    expect(await repository.getBook('missing')).toBeNull()
  })

  it('gets a unit by book and unit id, or null when missing', async () => {
    expect((await repository.getUnit('book-1', 'unit-01'))?.id).toBe('unit-01')
    expect(await repository.getUnit('book-1', 'missing')).toBeNull()
    expect(await repository.getUnit('missing', 'unit-01')).toBeNull()
  })

  it('gets a quiz by book, unit and quiz id, or null when missing', async () => {
    expect((await repository.getQuiz('book-1', 'unit-01', 'quiz-1'))?.id).toBe('quiz-1')
    expect(await repository.getQuiz('book-1', 'unit-01', 'missing')).toBeNull()
    expect(await repository.getQuiz('book-1', 'missing', 'quiz-1')).toBeNull()
  })
})
