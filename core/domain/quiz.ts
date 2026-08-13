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
 * owns its own correctness rule. The `never` default is what makes that promise
 * real: add a member to the Question union without handling it here and this
 * file stops compiling.
 *
 * Guards on `question.type` rather than `question` itself: with only one
 * question type today, `Question` is a plain object type, not yet a real
 * union, so TypeScript can only narrow the *discriminant* to `never` here.
 * Once a second question type exists, `Question` becomes a true union and an
 * unhandled case's `type` literal fails to narrow to `never`, so this keeps
 * catching the gap either way.
 */
export function grade(question: Question, answer: string | undefined): boolean {
  switch (question.type) {
    case 'multiple-choice-meaning':
      return answer === question.correctChoiceId
    default:
      return assertUnhandledQuestionType(question.type)
  }
}

function assertUnhandledQuestionType(questionType: never): never {
  throw new Error(`Unhandled question type: ${questionType}`)
}

export function scoreQuiz(session: QuizSession): QuizResult {
  const total = session.quiz.questions.length
  const correct = session.quiz.questions.filter((question) =>
    grade(question, session.answers[question.id]),
  ).length
  return { total, correct, score: total === 0 ? 0 : correct / total }
}
