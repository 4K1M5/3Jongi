# Design: Book → Unit → Quiz content model with multiple question types

_Date: 2026-08-12_

## Goal

Move the app from a single hardcoded sample unit to a real, data-driven content
model that:

- groups content as **Book → Unit → Quiz → Question**, so more books (Book 2,
  future books) slot in later;
- stores questions as **validated JSON data**, rendered by generic components —
  not as hand-written pages;
- supports **multiple question types** behind one seam, while **only the
  multiple-choice type is implemented in this iteration**;
- validates AI-generated content (Haiku output) **before build**, with precise,
  correctable error messages.

## Decisions (with rationale)

1. **Content format: JSON, schema-validated.** Content lives in JSON files.
   A single [zod](https://zod.dev) schema is the source of truth: the TypeScript
   domain types are derived from it via `z.infer`. Chosen over TypeScript content
   modules because content is AI-generated and must be validated/corrected quickly
   and independently of the app build, and because JSON matches the exact shape a
   real backend adapter will later serve and validate.

2. **Validation runs three ways from one schema:**
   - **On-demand / CI:** a `validate-content` script parses every JSON file and
     fails with a message pointing at the offending book/unit/quiz/question.
   - **Editor:** a JSON Schema generated from the zod schema is referenced by the
     content files (`$schema`), giving live red-squiggles as content is written.
   - **App load:** the content loader validates on import, so a bad file can never
     silently ship.
   The schema also enforces **semantic** rules a plain type cannot: `correctChoiceId`
   must reference a real choice, ids must be unique within scope, prompts/labels
   non-empty. These are exactly the mistakes AI output makes.

3. **Progress: per quiz.** Each quiz stores its own best score and attempt count;
   the result screen shows after finishing each quiz. The unit page rolls up its
   quizzes (e.g. "2 of 3 passed", per-quiz best badge).

4. **Question-type extensibility via a dispatch seam.** Each question carries a
   `type` discriminator. Two dispatch points — one for **rendering** (type → Vue
   component) and one for **grading** (type → scoring rule) — are built now, with
   only the multiple-choice type wired. Future types (KO→EN, EN→KO, reading) are
   added by supplying a schema variant + a grader + a view, with no change to the
   quiz runner, scorer, pages, or progress.

5. **Routing includes the book.** `/books/[bookId]/[unitId]/[quizId]`, so Book 2
   scales cleanly. With one book today, `/` lands directly on that book's units;
   a book-selection screen is added when a second book exists.

## Copyright guardrail

This is the **public** repo. Per `CLAUDE.local.md`, no copyrightable King Sejong
Institute material ships here — not the transcript, vocabulary lists, example
sentences, nor the PDF. The private book (`../3jongi-private/book/korean1-cleaned.md`)
and `data/vocab/` are read **locally only**, as reference for drafting **original**
questions that are reviewed before publishing. Book/unit **titles** are kept
neutral/original (e.g. "Book 1"), not KSI branding. No book text enters this repo
except as reviewed, rephrased, original questions.

## Data model

Framework-agnostic, in `core/domain/`. Types are `z.infer` of the zod schemas.

```
Book     { id, title, units: Unit[] }
Unit     { id, title, quizzes: Quiz[] }
Quiz     { id, title, questions: Question[] }
Question = MultipleChoiceQuestion | <future types>   // discriminated on `type`

MultipleChoiceQuestion {
  type: 'multiple-choice-meaning'
  id: string
  prompt: string
  choices: { id: string; label: string }[]
  correctChoiceId: string          // schema-checked to be one of choices[].id
}
```

- Ids are stable, human-readable slugs (`korean-1`, `unit-02`, `vocab-1`, `q1`).
- A quiz's questions are a heterogeneous list in principle (the union), but a quiz
  may be all one type (e.g. a translation quiz of 5 sentences). No quiz-level type
  field is needed; the quiz `title` labels it for the UI.

## Schema & validation (`core/domain/schema.ts`)

- zod schemas: `multipleChoiceQuestionSchema`, `questionSchema`
  (`z.discriminatedUnion('type', [...])`), `quizSchema`, `unitSchema`, `bookSchema`.
- Domain types in `models.ts` are `z.infer` re-exports of these — **one source of
  truth**. Rationale: DRY, and the runtime contract cannot drift from the compile
  type. zod is a small, framework-agnostic library, acceptable inside `core/domain`.
- A pure `parseBook(raw: unknown): Book` (and `parseBooks`) validates and throws a
  contextual error. This function is the shared validation used by both the app
  loader and the CLI script — no duplication.
- Semantic refinements via `.superRefine`: unique ids per scope; `correctChoiceId`
  ∈ `choices[].id`; non-empty strings.
- A JSON Schema is generated from the zod schema (build step or committed artifact)
  for editor `$schema` support.

## Content files

Grouped by book, one file per unit for easy hand/AI editing:

```
core/content/books/
  korean-1/
    book.json      // { "$schema": "...", "id": "korean-1", "title": "Book 1", "unitOrder": ["unit-01", ...] }
    unit-01.json   // { "$schema": "...", "id": "unit-01", "title": "...", "quizzes": [ ... ] }
    unit-02.json
```

- The existing `core/content/sample-unit.ts` is converted into this JSON shape as
  original seed content (a `korean-1` / sample unit) so the app has real data to
  run against. No book-derived content is added in this iteration.

## Content loading & repository

- **Discovery lives in the app layer** (Vite `import.meta.glob` is not available in
  pure `core/`). An `app/` content loader glob-imports the raw JSON, runs the
  domain `parseBooks`, and constructs the static repository. `core/` stays pure.
- **`ContentRepository` port** gains book-aware reads (exact signatures finalized in
  the plan):
  - `listBooks()` → book summaries (id, title)
  - `getBook(bookId)` → book with its units
  - `getUnit(bookId, unitId)` → unit with its quizzes + questions
  - `getQuiz(bookId, unitId, quizId)` → a single quiz
- `StaticContentRepository` is constructed from the validated in-memory books; a
  future `HttpContentRepository` implements the same port and reuses `parseBook`
  to validate responses.

## Rendering seam

- `QuestionView.vue` — dispatcher that switches on `question.type` and renders the
  matching per-type component. Today: `multiple-choice-meaning` →
  `MultipleChoiceQuestionView.vue` (unchanged behavior). An unknown type renders a
  visible fallback rather than failing silently.
- `QuizRunner.vue` renders `<QuestionView>` instead of hardcoding the MCQ view.

## Grading seam

- Domain `grade(question, answer): boolean` dispatches on `question.type`.
  MCQ grader: `answer === correctChoiceId`.
- `scoreQuiz` calls `grade` and stays type-agnostic. `answers` stays
  `Record<questionId, string>` (a choiceId today; typed text for future types).
- `QuizResultSummary` renders per-type review rows via the same dispatch, instead
  of assuming choices/`correctChoiceId`.

## Progress

- `QuizProgress { bookId, unitId, quizId, attempts, bestScore, completedAt }`.
- localStorage key: `3jongi:v1:progress:{bookId}:{unitId}:{quizId}`.
- `ProgressRepository` port generalized from unit-keyed to quiz-keyed.
  `LocalStorageProgressRepository` and its test updated accordingly.
- Unit page rolls up its quizzes' progress for the overview.

## Routing

```
/                                        → Book 1's units (land directly; book list added with Book 2)
/books/[bookId]/[unitId]                 → unit overview: list of quizzes with per-quiz progress
/books/[bookId]/[unitId]/[quizId]        → run the quiz (QuizRunner); result shown on finish
```

All routes prerender as static pages (Nuxt crawl / route rules), consistent with the
current GitHub Pages build.

## Scope

**In this iteration:**

- Book → Unit → Quiz → Question model; zod schema + inferred types; semantic checks.
- `validate-content` script + CI gate + generated JSON Schema for editor.
- JSON content loader (app layer) + `parseBooks` (domain) + updated
  `StaticContentRepository`.
- Rendering + grading dispatch seams, with **only the multiple-choice type wired**.
- Per-quiz progress (model, port, localStorage adapter, unit-page rollup).
- Book-aware routing; land directly on units.
- Convert the existing sample into the new JSON shape as original seed content.

**Explicitly not in this iteration (YAGNI / later):**

- Translation (KO→EN, EN→KO) and reading-comprehension question types.
- Real book-derived content (separate, reviewed authoring step: generate JSON →
  validate → review → publish).
- Book-selection landing screen (added when Book 2 exists).
- Any backend/HTTP adapter.

## Testing

- **Domain (Vitest, TDD):** `grade` dispatch and MCQ grading; `scoreQuiz` via the
  seam; `parseBook` accepts valid content and rejects each semantic violation
  (bad `correctChoiceId`, duplicate ids, empty strings) with a useful error.
- **Adapter:** `StaticContentRepository` book/unit/quiz lookups; miss → null.
  `LocalStorageProgressRepository` round-trips the new quiz key.
- **Script:** `validate-content` exits non-zero and names the file on bad JSON.
- Existing `quiz.test.ts` / `progress.test.ts` / repository tests updated to the
  new shapes.

## Open items (resolve during planning)

- Exact `ContentRepository` method signatures and summary vs. full return shapes.
- Whether the JSON Schema is generated at build time or committed as an artifact.
- Naming: "Quiz" (runnable set) vs "Unit" (group) vs "Book" (top) is the standard;
  UI copy may say "test" if preferred.
