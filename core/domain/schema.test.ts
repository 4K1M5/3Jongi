import { describe, expect, it } from 'vitest'
import { parseBook } from './schema'

/** A valid book fixture; individual tests clone and corrupt one part of it. */
function validBookInput() {
  return {
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
}

describe('parseBook', () => {
  it('returns a typed book for valid input', () => {
    const book = parseBook(validBookInput())
    expect(book.id).toBe('book-1')
    expect(book.units[0]!.quizzes[0]!.questions[0]!.type).toBe('multiple-choice-meaning')
  })

  it('rejects a correctChoiceId that is not one of the choices', () => {
    const input = validBookInput()
    input.units[0]!.quizzes[0]!.questions[0]!.correctChoiceId = 'nope'
    expect(() => parseBook(input)).toThrow(/correctChoiceId/i)
  })

  it('rejects duplicate choice ids within a question', () => {
    const input = validBookInput()
    input.units[0]!.quizzes[0]!.questions[0]!.choices[1]!.id = 'c1'
    expect(() => parseBook(input)).toThrow(/choice/i)
  })

  it('rejects duplicate question ids within a quiz', () => {
    const input = validBookInput()
    const quiz = input.units[0]!.quizzes[0]!
    quiz.questions.push({ ...quiz.questions[0]! })
    expect(() => parseBook(input)).toThrow(/question/i)
  })

  it('rejects duplicate quiz ids within a unit', () => {
    const input = validBookInput()
    const unit = input.units[0]!
    unit.quizzes.push({ ...unit.quizzes[0]! })
    expect(() => parseBook(input)).toThrow(/quiz/i)
  })

  it('rejects duplicate unit ids within a book', () => {
    const input = validBookInput()
    input.units.push({ ...input.units[0]! })
    expect(() => parseBook(input)).toThrow(/unit/i)
  })

  it('rejects an empty prompt', () => {
    const input = validBookInput()
    input.units[0]!.quizzes[0]!.questions[0]!.prompt = ''
    expect(() => parseBook(input)).toThrow()
  })

  it('rejects an unknown question type', () => {
    const input = validBookInput()
    ;(input.units[0]!.quizzes[0]!.questions[0] as { type: string }).type = 'mystery'
    expect(() => parseBook(input)).toThrow()
  })

  it('rejects a quiz with no questions', () => {
    const input = validBookInput()
    input.units[0]!.quizzes[0]!.questions = []
    expect(() => parseBook(input)).toThrow()
  })
})
