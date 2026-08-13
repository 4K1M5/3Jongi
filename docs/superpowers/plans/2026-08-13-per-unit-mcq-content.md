# Per-Unit MCQ Content (Units 1–2 Pilot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `sample` book with `ksi-korean-1`, author reviewed KO→EN multiple-choice content for units 1 and 2, and add machine-enforced content-quality rules that catch the authoring mistakes the zod schema cannot express.

**Architecture:** Content is validated JSON under `core/content/books/<bookId>/`, discovered by a Vite glob and assembled by the pure `load-books.ts`. No new runtime code paths: the pilot adds content plus one new pure domain module (`core/content/question-quality.ts`) that reports authoring defects, wired into the existing content-integrity gate so CI fails before `generate`. A prerequisite task repairs the type foundation the whole content model is documented to rest on.

**Tech Stack:** Nuxt 4, @nuxt/ui 4, Tailwind 4, TypeScript, zod 4 (schema is the single source of truth), Vitest 4.

## Global Constraints

- **Copyright:** only original, self-authored content ships in this public repo. Never commit the textbook transcript, the extracted vocabulary datasets, the source PDF, or the book's example sentences (`ex_ko`/`ex_en`). There is **no `.gitignore` safety net** — only `*.local.md` is ignored. Inspect every file before `git add`.
- **Private source data** lives in `../3jongi-private/data/vocab/` (`unit_NN.json` = originally extracted words, `extended/unit_NN.json` = words recovered from previously unmined pages). Read it locally; never copy it into this repo.
- **Direction:** KO→EN only. Korean word as `prompt`, four English glosses as choices.
- **Choice count:** exactly 4 per question.
- **Set size rule:** `ceil(words / 9)` sets per unit, sizes evened out. This guarantees the 6–9 questions-per-set invariant. (The spec states `round(words / 8)`; that breaks the invariant once cleanups change a count — 19 words would give 2 sets of 10 and 9. Use `ceil(words / 9)`.)
- **Gloss convention:** verbs `to X`; adjectives `to be X`; nouns and adverbs bare; set expressions a natural gloss. One primary meaning per gloss — no comma-piled synonyms.
- **Gloss uniqueness:** every gloss must identify exactly one Korean word across the whole book. Colliding words both get a qualifier.
- **Symmetric qualifiers:** if the correct answer carries a parenthetical, its distractors carry comparable ones — otherwise the parenthetical is the answer.
- **Ids:** book `ksi-korean-1`; units `unit-01`…`unit-10`; quizzes `set-1`…`set-6`; questions `q1`…`q9`; choices `c1`…`c4`.
- **Node/npm:** npm 12 is required (npm 10.9.x mis-generates this lockfile). Do not regenerate `package-lock.json` with an older npm.
- **Do not** reintroduce a `NUXT_APP_BASE_URL` env at generate time; the base path comes from `$production.app.baseURL` in `nuxt.config.ts`.

## File Structure

| File | Responsibility |
| --- | --- |
| `core/domain/schema.ts` | **Modify.** Export the `z.infer` content types it already defines schemas for. |
| `core/domain/quiz.ts` | **Modify.** Make `grade`'s exhaustiveness explicit with a `never` guard. |
| `.github/workflows/deploy.yml` | **Modify.** Add a `Typecheck` step so the type foundation cannot silently rot again. |
| `core/content/question-quality.ts` | **Create.** Pure rules reporting content defects the schema cannot express. One responsibility: given `Book[]`, return a list of located issues. |
| `core/content/question-quality.test.ts` | **Create.** Unit tests over hand-built fixtures, including the deliberate non-rule. |
| `core/content/content-integrity.test.ts` | **Modify.** Apply the new rules to the real shipped content. |
| `core/content/books/sample/` | **Delete.** Placeholder content (3 files). |
| `core/content/books/ksi-korean-1/book.json` | **Create.** `{ id, title }` manifest. |
| `core/content/books/ksi-korean-1/unit-01.json` | **Create.** 19 words in 3 quizzes. |
| `core/content/books/ksi-korean-1/unit-02.json` | **Create.** 23 words in 3 quizzes. |
| `README.md` | **Modify.** Add the not-affiliated disclaimer. |
| `CLAUDE.local.md`, `HANDOVER.local.md` | **Modify, not committed** (git-ignored via `*.local.md`). Amend the branding rule; rewrite the learner section. |

---

### Task 1: Restore the type foundation

`core/domain/models.ts:7-14` re-exports `Book`, `Choice`, `MultipleChoiceQuestion`, `Question`, `Quiz` and `Unit` from `./schema`, but `schema.ts` never exports those type names. `npm run typecheck` reports **18 errors** and is run neither locally nor in CI, so nothing catches it. Vitest and Vite erase types without checking, which is why tests and `generate` pass regardless.

The consequence is not cosmetic. Because the types resolve to errors, consumers' callback parameters degrade to implicit `any`, and `quiz.ts:48` reports *"Function lacks ending return statement"* — the exhaustiveness guarantee that the content model documents as its safety net for adding new question types does not exist. Task 2's rules module would import these types and silently receive `any`, making its type safety fiction.

**Files:**
- Modify: `core/domain/schema.ts` (add type exports after the schema definitions; simplify `parseBook`/`parseBooks` return types)
- Modify: `core/domain/quiz.ts:43-53`
- Modify: `.github/workflows/deploy.yml` (add a step before `Test`)

**Interfaces:**
- Consumes: nothing.
- Produces: the types `Choice`, `MultipleChoiceQuestion`, `Question`, `Quiz`, `Unit`, `Book` exported from `core/domain/schema.ts` and re-exported by `core/domain/models.ts`. Every later task depends on these being real types.

- [ ] **Step 1: Confirm the failure**

Run: `npm run typecheck`

Expected: FAIL. Among the output, `core/domain/models.ts(8,3): error TS2305: Module '"./schema"' has no exported member 'Book'.` plus five sibling `TS2305`/`TS2724` errors, `core/domain/quiz.ts(48,72): error TS2366: Function lacks ending return statement`, and several `TS7006` implicit-`any` errors in `app/components/*.vue`, `core/domain/quiz.ts` and `core/infrastructure/static-content-repository.ts`. Record the total count.

- [ ] **Step 2: Export the inferred content types**

In `core/domain/schema.ts`, insert immediately after the `bookManifestSchema` definition and before `parseBook`:

```ts
// Content types, inferred from the schemas above so the runtime contract and the
// compile-time types cannot drift. Consumers import these via `models.ts`.
export type Choice = z.infer<typeof choiceSchema>
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>
export type Question = z.infer<typeof questionSchema>
export type Quiz = z.infer<typeof quizSchema>
export type Unit = z.infer<typeof unitSchema>
export type Book = z.infer<typeof bookSchema>
```

Then replace the two parse helpers so they use the named types rather than repeating `z.infer`:

```ts
/** Validates a single book, throwing a ZodError with a path to any bad item. */
export function parseBook(raw: unknown): Book {
  return bookSchema.parse(raw)
}

/** Validates a list of books. */
export function parseBooks(raw: unknown): Book[] {
  return z.array(bookSchema).parse(raw)
}
```

- [ ] **Step 3: Make `grade`'s exhaustiveness explicit**

Replace `core/domain/quiz.ts:43-53` with:

```ts
/**
 * Scores a single answer. Dispatches on `question.type` so each question type
 * owns its own correctness rule. The `never` default is what makes that promise
 * real: add a member to the Question union without handling it here and this
 * file stops compiling.
 */
export function grade(question: Question, answer: string | undefined): boolean {
  switch (question.type) {
    case 'multiple-choice-meaning':
      return answer === question.correctChoiceId
    default:
      return assertUnhandledQuestion(question)
  }
}

function assertUnhandledQuestion(question: never): never {
  throw new Error(`Unhandled question type: ${JSON.stringify(question)}`)
}
```

- [ ] **Step 4: Run typecheck and drive it to zero**

Run: `npm run typecheck`

Expected: PASS with 0 errors. The `TS7006` implicit-`any` errors resolve on their own, because the callback parameters now infer from real types. If any error remains, annotate that specific call site explicitly — do **not** add `// @ts-ignore` and do **not** loosen `tsconfig`.

- [ ] **Step 5: Verify nothing else broke**

Run: `npm test`

Expected: PASS, 36 tests. The `never` guard changes `grade` only for a question type that cannot currently exist, so no test behaviour changes.

- [ ] **Step 6: Add the typecheck gate to CI**

In `.github/workflows/deploy.yml`, insert this step between the `npm ci` step and the `Test` step:

```yaml
      # models.ts once re-exported types schema.ts never exported, and nothing
      # caught it: vitest and Vite erase types without checking. This gate stops
      # the type foundation rotting again.
      - name: Typecheck
        run: npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add core/domain/schema.ts core/domain/quiz.ts .github/workflows/deploy.yml
git commit -m "Export the inferred content types and gate typecheck in CI

models.ts re-exported Book, Question, Quiz and friends from schema.ts,
which never exported them. Nothing caught it -- vitest and Vite erase
types without checking, and typecheck ran neither locally nor in CI.

The cascade mattered: consumers' callbacks degraded to implicit any, and
grade() lost the exhaustiveness guarantee the content model documents as
its safety net for new question types. Adds an explicit never guard so
that guarantee is real, and gates typecheck in CI."
```

---

### Task 2: Content-quality rules the schema cannot express

The schema validates structure: `correctChoiceId` names a real choice, ids are unique, nothing is empty, there are at least two choices. It cannot know that a *wrong* option is also a correct answer, or that two different Korean words ship the same English gloss. With roughly 940 distractor decisions across the book, those are too many to catch by eye.

**Files:**
- Create: `core/content/question-quality.ts`
- Test: `core/content/question-quality.test.ts`

**Interfaces:**
- Consumes: `Book`, `Question` from `core/domain/models` (real types as of Task 1).
- Produces:
  - `normalizeGloss(label: string): string`
  - `type QualityRule = 'wrong-choice-count' | 'duplicate-choice-label' | 'duplicate-prompt' | 'duplicate-correct-gloss'`
  - `interface QualityIssue { readonly rule: QualityRule; readonly path: string; readonly message: string }`
  - `findQuestionQualityIssues(books: readonly Book[]): QualityIssue[]`
  - Task 3 consumes `findQuestionQualityIssues` and `QualityIssue`.

- [ ] **Step 1: Write the failing tests**

Create `core/content/question-quality.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run core/content/question-quality.test.ts`

Expected: FAIL — cannot resolve `./question-quality`.

- [ ] **Step 3: Write the implementation**

Create `core/content/question-quality.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run core/content/question-quality.test.ts`

Expected: PASS, 9 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test` — Expected: PASS (36 existing + 9 new = 45).

Run: `npm run typecheck` — Expected: PASS, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add core/content/question-quality.ts core/content/question-quality.test.ts
git commit -m "Add content-quality rules the schema cannot express

The zod schema validates structure but cannot know that a wrong option
is also a correct answer, or that two Korean words ship the same English
gloss. Correct-answer uniqueness is what mechanically enforces the
disambiguating-qualifier rule.

Distractor labels are deliberately exempt: a pool-drawn distractor is
another word's gloss by design, so only prompts and correct answers are
globally unique. A test documents that non-rule."
```

---

### Task 3: Wire the rules into the content gate

**Files:**
- Modify: `core/content/content-integrity.test.ts`

**Interfaces:**
- Consumes: `findQuestionQualityIssues` from `./question-quality` (Task 2).
- Produces: nothing new. `npm run validate:content` now fails on quality defects as well as schema defects.

- [ ] **Step 1: Add the failing assertion**

In `core/content/content-integrity.test.ts`, add to the imports:

```ts
import { findQuestionQualityIssues } from './question-quality'
```

Then add this test inside the existing `describe('shipped content', ...)` block:

```ts
  it('has no content-quality issues the schema cannot catch', () => {
    const books = loadBooksFromModules(contentModules as Record<string, unknown>)
    const issues = findQuestionQualityIssues(books)
    // Mapped to strings so a failure names the exact question and rule.
    expect(issues.map((issue) => `${issue.path} [${issue.rule}] ${issue.message}`)).toEqual([])
  })
```

- [ ] **Step 2: Run the content gate**

Run: `npm run validate:content`

Expected: PASS. The `sample` content already satisfies every rule — 4 choices per question, unique prompts, unique correct glosses — so this proves the wiring without a content change. If it fails, the rules module has a bug; fix it before proceeding.

- [ ] **Step 3: Commit**

```bash
git add core/content/content-integrity.test.ts
git commit -m "Gate shipped content on the question-quality rules

npm run validate:content (and therefore npm test, which CI runs before
generate) now fails on an authoring defect, naming the exact question."
```

---

### Task 4: Replace the sample book and author unit 1

**Read before authoring:** `../3jongi-private/data/vocab/unit_01.json` (14 originally-extracted words) and `../3jongi-private/data/vocab/extended/unit_01.json` (6 recovered words). **Do not copy either file into this repo.** Author questions from them.

**Content decisions already made — apply them, do not re-derive:**

1. **Drop the extended entry `안녕하다` ("hello").** It duplicates `안녕하세요?` and its dictionary form is not how the greeting is used. This takes unit 1 from 20 words to **19**.
2. `안녕하세요?` → `hello (everyday polite)` and `안녕하십니까?` → `hello (very formal)`. These two collide on a bare "Hello?" and must be qualified symmetrically. Plain-English register labels, **not** `(polite)` / `(formal)`: 안녕하세요 is itself widely taught *as* the formal greeting (against plain 안녕), so `hello (formal)` would be defensible as a correct answer for it — a guard-1 breach the automated gate cannot detect. The real distinction is 해요체 vs 합니다체, and the labels must let a beginner act on it without knowing those terms.
3. `자기소개` → `self-introduction` (lowercase; the source has an inconsistent capital).
4. `영어` → `English (language)`, so it cannot read as a nationality.
5. `저` → `I (humble)`.

**Set composition —** `ceil(19 / 9) = 3` sets of 7, 6, 6, grouped thematically so distractors are naturally same-field:

| quiz | title | size | contents |
| --- | --- | --- | --- |
| `set-1` | `1. Introductions & Countries · Set 1` | 7 | the six country names + `나라` (country) |
| `set-2` | `1. Introductions & Countries · Set 2` | 6 | people: teacher, student, person, friend, everyone, `저` |
| `set-3` | `1. Introductions & Countries · Set 3` | 6 | meeting people: self-introduction, name, English, `어느`, and the two greetings |

**Files:**
- Delete: `core/content/books/sample/book.json`, `core/content/books/sample/unit-01.json`, `core/content/books/sample/unit-02.json`
- Create: `core/content/books/ksi-korean-1/book.json`
- Create: `core/content/books/ksi-korean-1/unit-01.json`

**Interfaces:**
- Consumes: the validation gate from Task 3.
- Produces: book id `ksi-korean-1` with unit `unit-01` containing quizzes `set-1`, `set-2`, `set-3`. Task 5 adds `unit-02.json` to the same folder and must not collide with any prompt or correct gloss used here.

- [ ] **Step 1: Delete the placeholder book and create the manifest**

```bash
git rm -r core/content/books/sample
```

Create `core/content/books/ksi-korean-1/book.json`:

```json
{
  "id": "ksi-korean-1",
  "title": "Korean 1"
}
```

- [ ] **Step 2: Run the gate to verify it fails**

Run: `npm run validate:content`

Expected: FAIL with `Book folder "ksi-korean-1" has no unit files` (thrown by `assembleBook` in `core/content/load-books.ts:60-62`). This confirms the gate is live before content is written.

- [ ] **Step 3: Author `unit-01.json`**

Create `core/content/books/ksi-korean-1/unit-01.json`. The exact structure to produce — no ambiguity about ids or titles:

```
unit-01  "1. Introductions & Countries"
  set-1  "1. Introductions & Countries · Set 1"   q1..q7   (7 country/nation words)
  set-2  "1. Introductions & Countries · Set 2"   q1..q6   (6 people words)
  set-3  "1. Introductions & Countries · Set 3"   q1..q6   (6 meeting-people words)
```

Question ids restart at `q1` in each quiz — they are unique per quiz, not per unit (`quizSchema` scopes the uniqueness check to a quiz). Every question has choices `c1`–`c4`.

Two questions are written out in full below to fix the conventions. Author the remaining 17 the same way, applying the distractor rules from Global Constraints.

```json
{
  "id": "unit-01",
  "title": "1. Introductions & Countries",
  "quizzes": [
    {
      "id": "set-1",
      "title": "1. Introductions & Countries · Set 1",
      "questions": [
        {
          "type": "multiple-choice-meaning",
          "id": "q1",
          "prompt": "나라",
          "choices": [
            { "id": "c1", "label": "country" },
            { "id": "c2", "label": "person" },
            { "id": "c3", "label": "name" },
            { "id": "c4", "label": "friend" }
          ],
          "correctChoiceId": "c1"
        }
      ]
    },
    {
      "id": "set-3",
      "title": "1. Introductions & Countries · Set 3",
      "questions": [
        {
          "type": "multiple-choice-meaning",
          "id": "q5",
          "prompt": "안녕하세요?",
          "choices": [
            { "id": "c1", "label": "hello (polite)" },
            { "id": "c2", "label": "hello (formal)" },
            { "id": "c3", "label": "self-introduction" },
            { "id": "c4", "label": "name" }
          ],
          "correctChoiceId": "c1"
        }
      ]
    }
  ]
}
```

Why `q5` looks like that: the two greetings collide on "hello", so both carry a qualifier and **both appear as options** — the learner must discriminate register rather than spot the odd one out. Contrast a violation, which this task must not produce:

```json
"choices": [
  { "id": "c1", "label": "hello (polite)" },
  { "id": "c2", "label": "country" },
  { "id": "c3", "label": "student" },
  { "id": "c4", "label": "friend" }
]
```

The only qualified option is the answer, so the parenthetical gives it away, and the fields are mixed.

- [ ] **Step 4: Run the gate to verify it passes**

Run: `npm run validate:content`

Expected: PASS, including the new quality test. If `duplicate-correct-gloss` fires, two words share a gloss — add qualifiers to both rather than deleting one.

- [ ] **Step 5: Verify the whole suite and the build**

Run: `npm test` — Expected: PASS.

Run: `npm run typecheck` — Expected: PASS, 0 errors.

- [ ] **Step 6: Check for copyrighted content before staging**

Run: `git status --porcelain` and confirm the only added paths are under `core/content/books/ksi-korean-1/`.

Read `core/content/books/ksi-korean-1/unit-01.json` and confirm it contains **no** example sentences, no `ex_ko`/`ex_en` fields, and no transcript text — only Korean headwords and authored English glosses.

- [ ] **Step 7: Commit**

```bash
git add core/content/books
git commit -m "Replace the sample book with ksi-korean-1 unit 1

19 words in 3 thematic quizzes (countries, people, meeting people), so
distractors are naturally same-field. The two greetings collide on a bare
'hello' and are both qualified and both offered, so the learner has to
discriminate register rather than spot the odd one out.

Drops the extended entry 안녕하다: it duplicates 안녕하세요? and its
dictionary form is not how the greeting is used."
```

---

### Task 5: Author unit 2

**Read before authoring:** `../3jongi-private/data/vocab/unit_02.json` (16 words) and `../3jongi-private/data/vocab/extended/unit_02.json` (7 words). 23 words total. **Do not copy either file into this repo.**

This unit carries the corpus's hardest collision cluster and is the reason it is in the pilot.

**Content decisions already made — apply them, do not re-derive:**

1. **The four sibling terms** collapse into two bare English glosses and must all be qualified, using speaker gender because that is what Korean encodes:
   - `누나` → `older sister (male speaker)`
   - `언니` → `older sister (female speaker)`
   - `형` → `older brother (male speaker)`
   - `오빠` → `older brother (female speaker)`
2. `동생` → `younger sibling` — one primary meaning, not the source's `younger brother/sister` slash form.
3. `아니다` → `to not be` — the verb convention, and it must not collide with `아니요` → `no`.
4. **Keep the three full-sentence entries** (`이름이 뭐예요?`, `직업이 뭐예요?`, `우리 가족이에요`). They are set expressions the unit teaches, and at 8–9 Korean characters they fit a `text-4xl` prompt. Step 5 verifies this visually; if one overflows on a narrow viewport, report it rather than silently dropping it.

**Set composition —** `ceil(23 / 9) = 3` sets of 8, 8, 7:

| quiz | title | size | contents |
| --- | --- | --- | --- |
| `set-1` | `2. Family & Occupations · Set 1` | 8 | family: father, mother, the four sibling terms, `동생`, `부모님` |
| `set-2` | `2. Family & Occupations · Set 2` | 8 | occupations and people: job, singer, actor, doctor, office worker, university student, family, picture |
| `set-3` | `2. Family & Occupations · Set 3` | 7 | expressions and verbs: `아니다`, `아니요`, `소개하다`, `그리고`, and the three set-expression sentences |

Putting all four sibling terms in `set-1` is deliberate: their distractors become each other, which is the strongest possible discrimination drill and keeps qualifiers symmetric throughout.

**Files:**
- Create: `core/content/books/ksi-korean-1/unit-02.json`

**Interfaces:**
- Consumes: `ksi-korean-1/book.json` from Task 4; the same conventions and the validation gate.
- Produces: unit `unit-02` with quizzes `set-1`, `set-2`, `set-3`. No prompt or correct gloss may collide with `unit-01.json` — the gate enforces this book-wide.

- [ ] **Step 1: Author `unit-02.json`**

Create `core/content/books/ksi-korean-1/unit-02.json`. The exact structure to produce:

```
unit-02  "2. Family & Occupations"
  set-1  "2. Family & Occupations · Set 1"   q1..q8   (8 family words)
  set-2  "2. Family & Occupations · Set 2"   q1..q8   (8 occupation/people words)
  set-3  "2. Family & Occupations · Set 3"   q1..q7   (7 expressions and verbs)
```

Same conventions as `unit-01.json`: question ids restart at `q1` per quiz, every question has choices `c1`–`c4`, `type` is always `"multiple-choice-meaning"`.

This is the worked example for the sibling cluster — author the other 22 questions the same way:

```json
{
  "type": "multiple-choice-meaning",
  "id": "q3",
  "prompt": "누나",
  "choices": [
    { "id": "c1", "label": "older sister (male speaker)" },
    { "id": "c2", "label": "older sister (female speaker)" },
    { "id": "c3", "label": "older brother (male speaker)" },
    { "id": "c4", "label": "older brother (female speaker)" }
  ],
  "correctChoiceId": "c1"
}
```

All four options are siblings, all four are qualified, and only the Korean word distinguishes them. Nothing about the option list leaks the answer.

- [ ] **Step 2: Run the gate to verify it passes**

Run: `npm run validate:content`

Expected: PASS. `duplicate-correct-gloss` firing here means a sibling qualifier was missed, or a unit-02 gloss collides with unit-01 (for example `학생` "student" in unit 1 against `대학생` "university student" in unit 2 — these must stay distinct).

- [ ] **Step 3: Verify the whole suite and the build**

Run: `npm test` — Expected: PASS.

Run: `npm run typecheck` — Expected: PASS, 0 errors.

Run: `npm run generate` — Expected: success, prerendering `/`, `/books/ksi-korean-1/unit-01`, `/books/ksi-korean-1/unit-02` and all six quiz routes.

- [ ] **Step 4: Check for copyrighted content before staging**

Read `core/content/books/ksi-korean-1/unit-02.json` and confirm no example sentences, no `ex_ko`/`ex_en`, no transcript text.

- [ ] **Step 5: Verify the sentence prompts render**

Run: `npm run dev`, open `/books/ksi-korean-1/unit-02/set-3`, and confirm the three set-expression prompts fit at `text-4xl` without overflowing — check a narrow viewport (375px) as well as desktop. Record the result; if one overflows, report it in the handoff rather than dropping the entry.

- [ ] **Step 6: Commit**

```bash
git add core/content/books/ksi-korean-1/unit-02.json
git commit -m "Add ksi-korean-1 unit 2

23 words in 3 quizzes. All four sibling terms sit in one quiz so their
distractors are each other: 누나/언니/형/오빠 collapse into two bare
English glosses, so each is qualified by speaker gender and all four are
offered together. Discrimination comes from knowing the word, not from
spotting the only qualified option."
```

---

### Task 6: Documentation and copyright-rule fixes

`ksi-korean-1` contradicts the "no KSI branding" rule as currently written. Naming the textbook is nominative reference, not copying — titles and institution names are not copyrightable expression — so the rule is corrected to target content, and implied affiliation is addressed with a disclaimer.

**Files:**
- Modify: `README.md` (committed)
- Modify: `CLAUDE.local.md` (**git-ignored**, not committed)
- Modify: `HANDOVER.local.md` (**git-ignored**, not committed)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the disclaimer and fix the status line in `README.md`**

Add this immediately after the README's opening description:

```markdown
> An independent personal-study project. Not affiliated with, endorsed by, or
> produced by the King Sejong Institute. All quiz content here is original,
> written for this app.
```

Then update the status line, which currently reads *"thin vertical slice scaffolded — one sample unit…"* — it now ships units 1–2 of a real book with machine-enforced content-quality checks.

- [ ] **Step 2: Amend the branding rule in `CLAUDE.local.md`**

Change the rule from prohibiting "KSI branding" to prohibiting copyrighted **content**: the transcript, extracted vocabulary datasets, example sentences (`ex_ko`/`ex_en`) and the source PDF stay private, while naming the source series is fine. Keep the "no `.gitignore` safety net" warning verbatim — it is still true.

- [ ] **Step 3: Amend `HANDOVER.local.md`**

Two edits:

- Apply the same rule correction as Step 2.
- Rewrite the "Learner / goal (drives priorities)" section. It describes the repo owner's own study plan (TTMIK level 1 done, units 1–8 are review, targeting a Book 2 course in September 2026) and must no longer drive content priorities. Replace it with: the app targets **any** Korean learner including a complete beginner starting at unit 1, may be shared with people at different levels, and content is authored in book order assuming no prior knowledge. Keep the owner's own plan as a clearly-labelled aside.
- Also record that `data/vocab/vocab_all.json` is incomplete and must be combined with `data/vocab/extended/`, and that units 11–20 have not been re-extracted.

- [ ] **Step 4: Verify only `README.md` is staged**

Run: `git status --porcelain`

Expected: `README.md` modified. `CLAUDE.local.md` and `HANDOVER.local.md` must **not** appear — they are ignored by the `*.local.md` rule. If they do appear, stop: the ignore rule is broken and those files reference private material.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "Add an independence disclaimer and refresh the status line

The book id names the source series, which is nominative reference rather
than copying. The real risk is implied affiliation, so state plainly that
this is an independent study project. The local rule files are corrected
to prohibit copyrighted content rather than the name."
```

---

### Task 7: Final verification and pilot handoff

**Files:** none modified.

**Interfaces:**
- Consumes: everything above.
- Produces: a verified pilot ready for the user's sign-off gate.

- [ ] **Step 1: Run every gate from a clean state**

```bash
npm run typecheck
npm test
npm run validate:content
npm run generate
```

Expected: all four pass. Record the test count and the list of prerendered routes.

- [ ] **Step 2: Click through the pilot in the real app**

Run `npm run dev` and verify, without relying on the tests:

- `/` lists exactly two units, titled `1. Introductions & Countries` and `2. Family & Occupations`, in that order
- each unit page shows 3 quiz cards with question counts 7/6/6 and 8/8/7
- completing a quiz records a best score, and the unit card shows the `n/3 done` rollup
- the quiz page heading shows the numbered unit title, so unit context is visible mid-quiz
- no route still references `sample`

- [ ] **Step 3: Confirm no private data reached the repo**

```bash
git log --stat -6
grep -rn "ex_ko\|ex_en" core/content/ || echo "clean"
```

Expected: no `ex_ko`/`ex_en` anywhere in `core/content/`, and no file outside `core/content/books/ksi-korean-1/`, `core/content/question-quality*`, `core/domain/`, `.github/`, `README.md` and `docs/`.

- [ ] **Step 4: Report for sign-off**

Summarize for the user: the counts authored, any word whose gloss needed a judgment call, the result of the narrow-viewport sentence-prompt check from Task 5 Step 5, and any collision the gate caught during authoring.

**Do not proceed to units 3–10.** That is gated on the user's review of this pilot. When it opens, author **unit 6 first** — units 1 and 2 contain no adjectives, so the `to be X` convention and same-POS adjective distractors are still untested, and unit 6 is the most verb- and adjective-heavy unit in scope.

---

## Notes for the reviewer

- **Task 1 is not in the spec.** It was found while planning: `npm run typecheck` fails with 18 errors, rooted in `schema.ts` never exporting its inferred types, and neither CI nor any local gate runs it. It is a prerequisite because Task 2's module imports those types and would otherwise receive `any`.
- **The set-size rule differs from the spec.** The spec says `round(words / 8)`; that breaks its own stated 6–9 invariant once a count changes (19 words → 2 sets of 10 and 9). This plan uses `ceil(words / 9)`, which guarantees the invariant and reproduces the spec's table for units 1–9.
- **Unit 1 ships 19 words, not the spec's 20.** `안녕하다` is dropped as a duplicate of `안녕하세요?`.
