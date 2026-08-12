// Domain models for the quiz app. Framework-agnostic — no Nuxt/Vue imports.
//
// The content types (Book → Unit → Quiz → Question) are inferred from the zod
// schemas in `schema.ts`, so there is one source of truth for both the runtime
// contract and the compile-time types.

export type {
  Book,
  Choice,
  MultipleChoiceQuestion,
  Question,
  Quiz,
  Unit,
} from './schema'

import type { Question } from './schema'

/** The kinds of quiz question the app can render. Grows as the union grows. */
export type QuizType = Question['type']

/** Fully identifies one quiz within the Book → Unit → Quiz hierarchy. */
export interface QuizRef {
  bookId: string
  unitId: string
  quizId: string
}

/** A learner's stored progress for a single quiz. */
export interface QuizProgress extends QuizRef {
  attempts: number
  /** Best score achieved, as a ratio in the range 0..1. */
  bestScore: number
  /** ISO timestamp of first completion, or null if never completed. */
  completedAt: string | null
}
