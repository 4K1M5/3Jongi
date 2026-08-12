import type { Question, Unit } from './models'

/** An in-progress attempt at a unit's quiz. Immutable — helpers return new sessions. */
export interface QuizSession {
  unit: Unit
  currentIndex: number
  /** Map of questionId -> selected choiceId. */
  answers: Readonly<Record<string, string>>
}

export interface QuizResult {
  total: number
  correct: number
  /** Ratio in the range 0..1. */
  score: number
}

export function createQuizSession(unit: Unit): QuizSession {
  return { unit, currentIndex: 0, answers: {} }
}

export function currentQuestion(session: QuizSession): Question | null {
  return session.unit.questions[session.currentIndex] ?? null
}

export function isFinished(session: QuizSession): boolean {
  return session.currentIndex >= session.unit.questions.length
}

/** Records the answer to the given question and advances to the next one. */
export function answerAndAdvance(
  session: QuizSession,
  questionId: string,
  choiceId: string,
): QuizSession {
  return {
    ...session,
    currentIndex: session.currentIndex + 1,
    answers: { ...session.answers, [questionId]: choiceId },
  }
}

export function isCorrect(question: Question, choiceId: string | undefined): boolean {
  return choiceId === question.correctChoiceId
}

export function scoreQuiz(session: QuizSession): QuizResult {
  const total = session.unit.questions.length
  const correct = session.unit.questions.filter((question) =>
    isCorrect(question, session.answers[question.id]),
  ).length
  return { total, correct, score: total === 0 ? 0 : correct / total }
}
