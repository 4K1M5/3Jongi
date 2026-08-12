import type { Question, Quiz } from './models'

/** An in-progress attempt at a quiz. Immutable — helpers return new sessions. */
export interface QuizSession {
  quiz: Quiz
  currentIndex: number
  /** Map of questionId -> the learner's answer (a choiceId for multiple-choice). */
  answers: Readonly<Record<string, string>>
}

export interface QuizResult {
  total: number
  correct: number
  /** Ratio in the range 0..1. */
  score: number
}

export function createQuizSession(quiz: Quiz): QuizSession {
  return { quiz, currentIndex: 0, answers: {} }
}

export function currentQuestion(session: QuizSession): Question | null {
  return session.quiz.questions[session.currentIndex] ?? null
}

export function isFinished(session: QuizSession): boolean {
  return session.currentIndex >= session.quiz.questions.length
}

/** Records the answer to the given question and advances to the next one. */
export function answerAndAdvance(
  session: QuizSession,
  questionId: string,
  answer: string,
): QuizSession {
  return {
    ...session,
    currentIndex: session.currentIndex + 1,
    answers: { ...session.answers, [questionId]: answer },
  }
}

/**
 * Scores a single answer. Dispatches on `question.type` so each question type
 * owns its own correctness rule; the exhaustive switch makes TypeScript flag any
 * new type that has not been handled here.
 */
export function grade(question: Question, answer: string | undefined): boolean {
  switch (question.type) {
    case 'multiple-choice-meaning':
      return answer === question.correctChoiceId
  }
}

export function scoreQuiz(session: QuizSession): QuizResult {
  const total = session.quiz.questions.length
  const correct = session.quiz.questions.filter((question) =>
    grade(question, session.answers[question.id]),
  ).length
  return { total, correct, score: total === 0 ? 0 : correct / total }
}
