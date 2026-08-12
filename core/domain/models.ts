// Domain models for the quiz app. Framework-agnostic — no Nuxt/Vue imports.

/** The kinds of quiz question the app can render. The union grows as types are added. */
export type QuizType = 'multiple-choice-meaning'

export interface Choice {
  id: string
  label: string
}

export interface MultipleChoiceQuestion {
  id: string
  type: 'multiple-choice-meaning'
  /** The word or phrase being tested (e.g. a Korean word). */
  prompt: string
  choices: Choice[]
  correctChoiceId: string
}

/** A quiz question, discriminated by `type` so renderers can switch exhaustively. */
export type Question = MultipleChoiceQuestion

export interface Unit {
  id: string
  title: string
  questions: Question[]
}

/** A learner's stored progress for a single unit. */
export interface UnitProgress {
  unitId: string
  attempts: number
  /** Best score achieved, as a ratio in the range 0..1. */
  bestScore: number
  /** ISO timestamp of first completion, or null if never completed. */
  completedAt: string | null
}
