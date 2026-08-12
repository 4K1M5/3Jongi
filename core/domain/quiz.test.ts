import { describe, expect, it } from 'vitest'
import type { Quiz } from './models'
import {
  answerAndAdvance,
  createQuizSession,
  currentQuestion,
  grade,
  isFinished,
  scoreQuiz,
} from './quiz'

const quiz: Quiz = {
  id: 'quiz-1',
  title: 'Test quiz',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice-meaning',
      prompt: 'A',
      choices: [
        { id: 'a', label: 'right' },
        { id: 'b', label: 'wrong' },
      ],
      correctChoiceId: 'a',
    },
    {
      id: 'q2',
      type: 'multiple-choice-meaning',
      prompt: 'B',
      choices: [
        { id: 'a', label: 'wrong' },
        { id: 'b', label: 'right' },
      ],
      correctChoiceId: 'b',
    },
  ],
}

describe('createQuizSession', () => {
  it('starts at the first question with no answers', () => {
    const session = createQuizSession(quiz)
    expect(session.currentIndex).toBe(0)
    expect(session.answers).toEqual({})
    expect(currentQuestion(session)?.id).toBe('q1')
    expect(isFinished(session)).toBe(false)
  })
})

describe('answerAndAdvance', () => {
  it('records the answer and moves to the next question without mutating the input', () => {
    const session = createQuizSession(quiz)
    const next = answerAndAdvance(session, 'q1', 'a')

    expect(next.currentIndex).toBe(1)
    expect(next.answers).toEqual({ q1: 'a' })
    // original session is untouched
    expect(session.currentIndex).toBe(0)
    expect(session.answers).toEqual({})
  })

  it('is finished once every question is answered', () => {
    let session = createQuizSession(quiz)
    session = answerAndAdvance(session, 'q1', 'a')
    session = answerAndAdvance(session, 'q2', 'b')
    expect(isFinished(session)).toBe(true)
    expect(currentQuestion(session)).toBeNull()
  })
})

describe('grade', () => {
  it('scores a multiple-choice answer against its correct choice', () => {
    const question = quiz.questions[0]!
    expect(grade(question, 'a')).toBe(true)
    expect(grade(question, 'b')).toBe(false)
    expect(grade(question, undefined)).toBe(false)
  })
})

describe('scoreQuiz', () => {
  it('scores all-correct as 1', () => {
    let session = createQuizSession(quiz)
    session = answerAndAdvance(session, 'q1', 'a')
    session = answerAndAdvance(session, 'q2', 'b')
    expect(scoreQuiz(session)).toEqual({ total: 2, correct: 2, score: 1 })
  })

  it('scores a mix proportionally', () => {
    let session = createQuizSession(quiz)
    session = answerAndAdvance(session, 'q1', 'a')
    session = answerAndAdvance(session, 'q2', 'a')
    expect(scoreQuiz(session)).toEqual({ total: 2, correct: 1, score: 0.5 })
  })
})
