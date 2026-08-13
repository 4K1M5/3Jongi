import type { Book, Question } from '../domain/models'

// Content-quality rules that the zod schema cannot express.
//
// The schema guarantees a question is structurally sound: its correctChoiceId is
// a real choice, ids are unique, nothing is empty. It has no way to know that a
// *wrong* option is also a correct answer, or that two different Korean words
// ship the same English gloss. Those are authoring mistakes, and with roughly
// 940 distractor decisions across the book they are too many to catch by eye.
//
// Deliberately NOT a rule: distractor labels repeat freely across the book. A
// pool-drawn distractor is another word's gloss by design, so global uniqueness
// applies only to prompts and to correct answers.

const REQUIRED_CHOICE_COUNT = 4

export type QualityRule =
  | 'wrong-choice-count'
  | 'duplicate-choice-label'
  | 'duplicate-prompt'
  | 'duplicate-correct-gloss'

export interface QualityIssue {
  readonly rule: QualityRule
  /** `bookId/unitId/quizId/questionId`, so a failure names the exact question. */
  readonly path: string
  readonly message: string
}

interface LocatedQuestion {
  readonly question: Question
  readonly path: string
}

/**
 * Compares glosses by meaning rather than spelling, so the part-of-speech
 * convention ("to study", "to be cold") cannot hide a real collision. Qualifiers
 * are preserved — they are precisely what makes a colliding gloss unique.
 */
export function normalizeGloss(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^to be /, '')
    .replace(/^to /, '')
}

function locateQuestions(book: Book): LocatedQuestion[] {
  return book.units.flatMap((unit) =>
    unit.quizzes.flatMap((quiz) =>
      quiz.questions.map((question) => ({
        question,
        path: `${book.id}/${unit.id}/${quiz.id}/${question.id}`,
      })),
    ),
  )
}

function correctChoiceLabel(question: Question): string {
  const correct = question.choices.find((choice) => choice.id === question.correctChoiceId)
  if (correct === undefined) {
    throw new Error(
      `Question "${question.id}" has no choice matching correctChoiceId "${question.correctChoiceId}"`,
    )
  }
  return correct.label
}

function findChoiceCountIssue({ question, path }: LocatedQuestion): QualityIssue | null {
  if (question.choices.length === REQUIRED_CHOICE_COUNT) return null
  return {
    rule: 'wrong-choice-count',
    path,
    message: `expected ${REQUIRED_CHOICE_COUNT} choices, found ${question.choices.length}`,
  }
}

function findDuplicateChoiceLabelIssue({ question, path }: LocatedQuestion): QualityIssue | null {
  const seen = new Set<string>()
  for (const choice of question.choices) {
    const gloss = normalizeGloss(choice.label)
    if (seen.has(gloss)) {
      return {
        rule: 'duplicate-choice-label',
        path,
        message: `two choices mean the same thing: "${gloss}"`,
      }
    }
    seen.add(gloss)
  }
  return null
}

/** Reports every occurrence after the first for a key that must be unique book-wide. */
function findDuplicatesAcrossQuestions(
  located: readonly LocatedQuestion[],
  rule: QualityRule,
  keyOf: (question: Question) => string,
  describe: (key: string, firstPath: string) => string,
): QualityIssue[] {
  const firstSeenAt = new Map<string, string>()
  const issues: QualityIssue[] = []
  for (const item of located) {
    const key = keyOf(item.question)
    const firstPath = firstSeenAt.get(key)
    if (firstPath === undefined) {
      firstSeenAt.set(key, item.path)
      continue
    }
    issues.push({ rule, path: item.path, message: describe(key, firstPath) })
  }
  return issues
}

export function findQuestionQualityIssues(books: readonly Book[]): QualityIssue[] {
  return books.flatMap((book) => findIssuesInBook(book))
}

// Uniqueness is scoped to ONE book, not to the whole content set. Each book
// drills a given word once, but two books may legitimately teach the same word
// with the same gloss, so their prompts and correct answers must not collide
// with each other.
function findIssuesInBook(book: Book): QualityIssue[] {
  const located = locateQuestions(book)

  const perQuestion = located.flatMap((item) =>
    [findChoiceCountIssue(item), findDuplicateChoiceLabelIssue(item)].filter(
      (issue): issue is QualityIssue => issue !== null,
    ),
  )

  const duplicatePrompts = findDuplicatesAcrossQuestions(
    located,
    'duplicate-prompt',
    (question) => question.prompt.trim(),
    (key, firstPath) => `prompt "${key}" is already drilled at ${firstPath}`,
  )

  const duplicateGlosses = findDuplicatesAcrossQuestions(
    located,
    'duplicate-correct-gloss',
    (question) => normalizeGloss(correctChoiceLabel(question)),
    (key, firstPath) =>
      `correct answer "${key}" is already the answer at ${firstPath} — add a disambiguating qualifier`,
  )

  return [...perQuestion, ...duplicatePrompts, ...duplicateGlosses]
}
