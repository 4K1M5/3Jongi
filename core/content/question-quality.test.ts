import { describe, expect, it } from 'vitest'
import type { Book } from '../domain/models'
import { findQuestionQualityIssues, normalizeGloss } from './question-quality'

function question(id: string, prompt: string, labels: string[], correctIndex = 0) {
  return {
    type: 'multiple-choice-meaning' as const,
    id,
    prompt,
    choices: labels.map((label, index) => ({ id: `c${index + 1}`, label })),
    correctChoiceId: `c${correctIndex + 1}`,
  }
}

function bookWith(...quizzes: { id: string; questions: ReturnType<typeof question>[] }[]): Book {
  return {
    id: 'ksi-korean-1',
    title: 'Korean 1',
    units: [
      {
        id: 'unit-01',
        title: '1. Test Unit',
        quizzes: quizzes.map((quiz) => ({ id: quiz.id, title: quiz.id, questions: quiz.questions })),
      },
    ],
  }
}

const FOUR_DISTINCT = ['country', 'person', 'name', 'friend']

describe('normalizeGloss', () => {
  it('compares glosses by meaning, not by part-of-speech prefix', () => {
    expect(normalizeGloss('to be cold')).toBe('cold')
    expect(normalizeGloss('To Study')).toBe('study')
    expect(normalizeGloss('  older   sister ')).toBe('older sister')
  })

  it('keeps a qualifier, because that is what makes a gloss unique', () => {
    expect(normalizeGloss('older sister (male speaker)')).not.toBe(
      normalizeGloss('older sister (female speaker)'),
    )
  })
})

describe('findQuestionQualityIssues', () => {
  it('reports nothing for clean content', () => {
    const books = [bookWith({ id: 'set-1', questions: [question('q1', '나라', FOUR_DISTINCT)] })]
    expect(findQuestionQualityIssues(books)).toEqual([])
  })

  it('flags a question that does not have exactly four choices', () => {
    const books = [
      bookWith({ id: 'set-1', questions: [question('q1', '나라', ['country', 'person', 'name'])] }),
    ]
    const issues = findQuestionQualityIssues(books)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('wrong-choice-count')
    expect(issues[0]!.path).toBe('ksi-korean-1/unit-01/set-1/q1')
  })

  it('flags two choices in one question that mean the same thing', () => {
    const books = [
      bookWith({
        id: 'set-1',
        questions: [question('q1', '춥다', ['to be cold', 'cold', 'name', 'friend'])],
      }),
    ]
    const issues = findQuestionQualityIssues(books)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('duplicate-choice-label')
  })

  it('flags the same prompt drilled twice', () => {
    const books = [
      bookWith(
        { id: 'set-1', questions: [question('q1', '나라', FOUR_DISTINCT)] },
        { id: 'set-2', questions: [question('q1', '나라', ['country', 'sky', 'water', 'road'])] },
      ),
    ]
    const issues = findQuestionQualityIssues(books)
    expect(issues.map((issue) => issue.rule)).toContain('duplicate-prompt')
    expect(issues.find((issue) => issue.rule === 'duplicate-prompt')!.path).toBe(
      'ksi-korean-1/unit-01/set-2/q1',
    )
  })

  it('flags a prompt duplicated only by trailing punctuation', () => {
    const books = [
      bookWith(
        { id: 'set-1', questions: [question('q1', '안녕하세요?', ['hello', 'name', 'country', 'friend'])] },
        { id: 'set-2', questions: [question('q1', '안녕하세요', ['greeting', 'sky', 'water', 'road'])] },
      ),
    ]
    const issues = findQuestionQualityIssues(books)
    expect(issues.map((issue) => issue.rule)).toContain('duplicate-prompt')
    expect(issues.find((issue) => issue.rule === 'duplicate-prompt')!.path).toBe(
      'ksi-korean-1/unit-01/set-2/q1',
    )
  })

  it('flags two different words shipping the same correct gloss', () => {
    const books = [
      bookWith(
        { id: 'set-1', questions: [question('q1', '누나', ['older sister', 'father', 'doctor', 'friend'])] },
        { id: 'set-2', questions: [question('q1', '언니', ['older sister', 'mother', 'singer', 'name'])] },
      ),
    ]
    const issues = findQuestionQualityIssues(books)
    const collision = issues.find((issue) => issue.rule === 'duplicate-correct-gloss')
    expect(collision).toBeDefined()
    expect(collision!.path).toBe('ksi-korean-1/unit-01/set-2/q1')
    expect(collision!.message).toContain('qualifier')
  })

  it('allows a distractor to repeat another question\'s correct answer', () => {
    // Deliberate non-rule: pool-drawn distractors ARE other words' glosses.
    // Only prompts and correct answers are globally unique.
    const books = [
      bookWith(
        { id: 'set-1', questions: [question('q1', '나라', ['country', 'person', 'name', 'friend'])] },
        { id: 'set-2', questions: [question('q1', '사람', ['person', 'country', 'name', 'friend'])] },
      ),
    ]
    expect(findQuestionQualityIssues(books)).toEqual([])
  })

  it('scopes uniqueness to one book, so two books may teach the same word', () => {
    const first = bookWith({ id: 'set-1', questions: [question('q1', '나라', FOUR_DISTINCT)] })
    const second = { ...bookWith({ id: 'set-1', questions: [question('q1', '나라', FOUR_DISTINCT)] }), id: 'ksi-korean-2' }
    expect(findQuestionQualityIssues([first, second])).toEqual([])
  })
})
