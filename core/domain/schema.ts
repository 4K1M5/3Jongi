import { z } from 'zod'

// Content schema — the single source of truth for the shape of quiz content.
// Domain types are inferred from these schemas (see models.ts), so the runtime
// contract and the compile-time types can never drift. The static content
// adapter and the `validate:content` script both validate through here, which
// is where AI-generated JSON is caught and corrected.

const nonEmpty = z.string().trim().min(1)

function firstDuplicate(ids: readonly string[]): string | null {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) return id
    seen.add(id)
  }
  return null
}

export const choiceSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
})

export const multipleChoiceQuestionSchema = z.object({
  type: z.literal('multiple-choice-meaning'),
  id: nonEmpty,
  prompt: nonEmpty,
  choices: z.array(choiceSchema).min(2),
  correctChoiceId: nonEmpty,
})

/** Discriminated on `type`; add a member here to introduce a new question type. */
export const questionSchema = z.discriminatedUnion('type', [multipleChoiceQuestionSchema])

export const quizSchema = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((quiz, ctx) => {
    const duplicateQuestionId = firstDuplicate(quiz.questions.map((question) => question.id))
    if (duplicateQuestionId !== null) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate question id "${duplicateQuestionId}"`,
        path: ['questions'],
      })
    }

    quiz.questions.forEach((question, index) => {
      if (question.type !== 'multiple-choice-meaning') return

      const duplicateChoiceId = firstDuplicate(question.choices.map((choice) => choice.id))
      if (duplicateChoiceId !== null) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate choice id "${duplicateChoiceId}"`,
          path: ['questions', index, 'choices'],
        })
      }

      const choiceIds = question.choices.map((choice) => choice.id)
      if (!choiceIds.includes(question.correctChoiceId)) {
        ctx.addIssue({
          code: 'custom',
          message: `correctChoiceId "${question.correctChoiceId}" is not one of the choices`,
          path: ['questions', index, 'correctChoiceId'],
        })
      }
    })
  })

export const unitSchema = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    quizzes: z.array(quizSchema).min(1),
  })
  .superRefine((unit, ctx) => {
    const duplicateQuizId = firstDuplicate(unit.quizzes.map((quiz) => quiz.id))
    if (duplicateQuizId !== null) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate quiz id "${duplicateQuizId}"`,
        path: ['quizzes'],
      })
    }
  })

export const bookSchema = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    units: z.array(unitSchema).min(1),
  })
  .superRefine((book, ctx) => {
    const duplicateUnitId = firstDuplicate(book.units.map((unit) => unit.id))
    if (duplicateUnitId !== null) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate unit id "${duplicateUnitId}"`,
        path: ['units'],
      })
    }
  })

/** A book's `book.json` manifest: its identity, separate from its unit files. */
export const bookManifestSchema = z.object({
  id: nonEmpty,
  title: nonEmpty,
})

// Content types, inferred from the schemas above so the runtime contract and the
// compile-time types cannot drift. Consumers import these via `models.ts`.
export type Choice = z.infer<typeof choiceSchema>
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>
export type Question = z.infer<typeof questionSchema>
export type Quiz = z.infer<typeof quizSchema>
export type Unit = z.infer<typeof unitSchema>
export type Book = z.infer<typeof bookSchema>

/** Validates a single book, throwing a ZodError with a path to any bad item. */
export function parseBook(raw: unknown): Book {
  return bookSchema.parse(raw)
}

/** Validates a list of books. */
export function parseBooks(raw: unknown): Book[] {
  return z.array(bookSchema).parse(raw)
}
