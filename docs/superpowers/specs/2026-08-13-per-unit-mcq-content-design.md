# Per-unit multiple-choice content for units 1–10

_Design spec — 2026-08-13._

## Goal

Replace the placeholder `sample` book with real, reviewed multiple-choice
vocabulary quizzes covering units 1–10 of the source textbook, authored as
original content in this public repo.

The content machinery already supports this without code changes: drop
`core/content/books/<bookId>/unit-NN.json` files in the existing shape and they
are discovered, validated and prerendered. One small code change is in scope —
new content-integrity checks (see [Validation](#validation)) — because the
current schema cannot detect a wrong answer that is secretly also correct.

## Audience

The app targets **any Korean learner, including someone starting from zero at
unit 1**, and may be shared with people at different levels. Content is authored
in book order and assumes no prior knowledge at unit 1. Recognition comes before
production. No unit is skipped or reordered on the assumption that a particular
learner already knows it.

## Decisions

| Question | Decision |
| --- | --- |
| Book identity | `ksi-korean-1`; the `sample` book is deleted |
| Coverage | Units 1–10, in book order; units 11–20 deferred pending learner testing |
| Quiz shape | Target ~8 questions per set, balanced; 40 quizzes total |
| Distractors | Pool-first (same part of speech and semantic field), authored only when the pool has no peer |
| Direction | KO→EN only for this pass |
| Sequencing | Author unit-01 end to end, get sign-off, then scale to units 2–10 |

## Book identity and repo hygiene

`core/content/books/sample/` is deleted and `core/content/books/ksi-korean-1/`
replaces it. No application code changes: nothing hardcodes the `sample` id
(`load-books.test.ts` builds its own fixtures) and `app/pages/index.vue` lands on
the first book automatically. Placeholder `3jongi:v1:progress:sample:*`
localStorage keys are orphaned, which is harmless for throwaway content.

The book id becomes part of every URL (`/books/ksi-korean-1/unit-01/set-1`) and
of the progress key prefix, so it is fixed now and not changed later.

Three documentation fixes ship alongside:

1. `CLAUDE.local.md` and `HANDOVER.local.md` — the "no KSI branding" rule becomes
   **"no copyrighted _content_; naming the source series is fine."** Naming the
   textbook is nominative reference, not copying; the rule as written
   contradicted the chosen book id.
2. `README.md` — add a line stating this is an independent personal-study project,
   not affiliated with or endorsed by the King Sejong Institute. This addresses
   implied affiliation, which is the real risk (trademark), as distinct from
   copyright.
3. `HANDOVER.local.md` — rewrite the "Learner / goal (drives priorities)" section.
   It describes the repo owner's own study plan and must not drive content
   priorities now that the audience is any beginner.

## Vocabulary corpus

**The corpus is copyrighted source data and stays out of this repo.** It lives in
the private sibling repo at `../3jongi-private/data/vocab/`. Only authored
questions cross into the public repo. No example sentences (`ex_ko`/`ex_en`) are
extracted at any point, so there is nothing to leak.

### Recovering the missing vocabulary

The pre-existing extraction (`../3jongi-private/scripts/vocab_build.py`) fed only
pages `start..start+4` of each unit to the extractor — the pages holding the
formal vocabulary section. Every word introduced later in a unit, in dialogues,
reading passages, drills and exercises, was never seen. A learner testing the app
reported exactly this gap.

Re-extracting the previously unmined pages of units 1–10 (74 pages) recovered
**161 additional words — 51% of the vocabulary a learner actually meets was
missing.**

| unit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| previously extracted | 14 | 16 | 13 | 15 | 16 | 14 | 13 | 22 | 11 | 18 | 152 |
| newly recovered | 6 | 7 | 12 | 12 | 11 | 25 | 16 | 24 | 21 | 27 | 161 |
| **total** | **20** | **23** | **25** | **27** | **27** | **39** | **29** | **46** | **32** | **45** | **313** |

Two properties of the extraction that must be preserved if it is ever re-run:

- **Extractors must not guess what is already known.** Agents told to find "words
  not already in the vocabulary list" silently omit real words based on a guess
  about what the list contains. Instruct them to extract everything;
  deduplication is mechanical.
- **Hallucination checking is deterministic, not a second model's opinion.** Each
  extracted item carries the exact surface form as it literally appears in the
  source; any item whose surface form is not present in the source text is
  discarded. This caught OCR-mangled and invented items in both runs.

Two pages are cross-unit "Comprehension Practice" review spreads — page 82
(covering units 1–5) and page 144 (units 6–10). They sit at the tail of units 5
and 10 but belong to neither, and they are dense with exercise meta-language.
They are excluded from unit slices and handled separately.

### Word attribution

Each word is attributed to the **earliest unit that introduces it**, so it is
drilled where it is taught and never twice. A word appearing in a later unit's
pages that was already taught earlier is a review occurrence, not a new word.

### Cleanups before authoring

- Drop weekday abbreviations that duplicate their full forms.
- Merge attributive number variants into their base forms.
- Collapse noun/verb-phrase duplicates for weather events into one noun plus one
  verb entry.
- Manually attribute the ~9 words that surface only in the review spreads.
- A small number of pre-existing entries are full sentences rather than words.
  These overflow a `text-4xl` prompt; during the pilot, either exclude them or
  confirm they render acceptably.

Expect the final total near 300 words.

## Content model

No schema changes. Files follow the shipped shape:
`core/content/books/ksi-korean-1/book.json` (`{ id, title }`) plus one
`unit-NN.json` per unit (`{ id, title, quizzes: [...] }`). Units are discovered
automatically and ordered by id, so zero-padded ids (`unit-01`…`unit-10`) sort
correctly.

Ids: quizzes `set-1`…`set-6`, questions `q1`…`q9`, choices `c1`…`c4`.

### Quiz shape

Sets per unit = `round(words / 8)`, with sizes evened out so no set is stranded
with one or two questions. This yields 40 quizzes and set sizes of 6–9.

| unit | words | sets | sizes |
| --- | --- | --- | --- |
| unit-01 | 20 | 3 | 7, 7, 6 |
| unit-02 | 23 | 3 | 8, 8, 7 |
| unit-03 | 25 | 3 | 9, 8, 8 |
| unit-04 | 27 | 3 | 9, 9, 9 |
| unit-05 | 27 | 3 | 9, 9, 9 |
| unit-06 | 39 | 5 | 8, 8, 8, 8, 7 |
| unit-07 | 29 | 4 | 8, 7, 7, 7 |
| unit-08 | 46 | 6 | 8, 8, 8, 8, 7, 7 |
| unit-09 | 32 | 4 | 8, 8, 8, 8 |
| unit-10 | 45 | 6 | 8, 8, 8, 7, 7, 7 |

Final counts shift slightly after the cleanups above; the rule, not the table, is
authoritative.

### Titles

The source book's chapter titles are full example sentences — copyrightable
expression — so they stay out. These titles are derived from each unit's own
vocabulary and are original:

| unit | title |
| --- | --- |
| unit-01 | 1. Introductions & Countries |
| unit-02 | 2. Family & Occupations |
| unit-03 | 3. Food & Preferences |
| unit-04 | 4. Places & Things |
| unit-05 | 5. Weather & Seasons |
| unit-06 | 6. Greetings & Good Wishes |
| unit-07 | 7. Places & Positions |
| unit-08 | 8. Numbers, Dates & Days |
| unit-09 | 9. Sports & Exercise |
| unit-10 | 10. Telling Time & Plans |

Quiz titles repeat the numbered unit title and append the set:
`"2. Family & Occupations · Set 1"`.

The number appears in both because it is otherwise invisible in the UI:
`UnitCard.vue` and `QuizCard.vue` render only the raw titles, and
`pages/books/[bookId]/[unitId]/[quizId].vue` renders `quiz.title` as the **only**
heading on the quiz page — its back button reads "Back to quizzes" and names no
unit. Without the number in the quiz title, a learner mid-quiz has no unit
context.

## Question authoring rules

Direction is KO→EN: the Korean word is the `prompt`, four English glosses are the
choices. `MultipleChoiceQuestionView.vue` renders the prompt at `text-4xl` with
choices as radio cards, which suits a short Korean prompt and English options.

### Gloss convention

| part of speech | form | example |
| --- | --- | --- |
| verb | `to X` | to study |
| adjective | `to be X` | to be cold |
| noun | bare noun | school |
| adverb | bare adverb | often |
| set expression | natural gloss | thank you |

One primary meaning per gloss; no piles of comma-separated synonyms. The
convention alone separates a noun from its `하다` verb.

### Disambiguating qualifiers

A gloss is a **disambiguating label, not merely a translation.** Every gloss must
identify exactly one Korean word in the whole pool.

The corpus contains 31 collisions where one English gloss maps to two or three
distinct Korean words. Sibling terms are the clearest case: Korean distinguishes
an older sibling by the speaker's gender, so a bare "older sister" is ambiguous
between two words. Both get a qualifier: `older sister (of a man)` and
`older sister (of a woman)`.

The largest group is numbers. Units 8 and 10 teach the **two different Korean
number systems** — Sino-Korean (used for dates and minutes) and native Korean
(used for counting and hours) — so every numeral from two to twelve collides.
These become `three (Sino-Korean)` and `three (native Korean)`. A numbers quiz
stays clean because all four options carry the same system tag, leaving only the
numeral to distinguish them.

### Distractor selection

Prefer real glosses of other words in the pool that share the prompt's part of
speech and semantic field. Author a gloss only when the pool has no plausible
same-field peer.

Two hard guards:

1. **No distractor may be a valid meaning of the prompt word.** The pool contains
   distinct words sharing a gloss, so a distractor drawn naively can be
   legitimately correct.
2. **Qualifiers must be symmetric.** If the correct answer carries a
   parenthetical and its distractors do not, the parenthetical _is_ the answer.
   When an answer needs a qualifier, its distractors carry comparable ones.

Options should also be similar in length and register, so none stands out as the
odd one.

## Validation

`npm run validate:content` already rejects a `correctChoiceId` that is not one of
the choices, duplicate ids at every scope, empty strings, fewer than two choices,
and units with no quizzes. It runs inside `npm test`, which CI runs **before**
`generate`, so malformed content fails the build.

It cannot detect a distractor that is also correct. Since roughly 940 distractor
decisions are too many to eyeball reliably, the following checks are added to
`core/content/content-integrity.test.ts`:

- no two choices within a question share a normalized label
- every question has exactly four choices
- prompts are unique across the book — each word is drilled once, in the unit
  that introduces it
- **every correct-answer gloss is unique across the book.** This is the check
  that does the real work: it is what mechanically enforces the
  disambiguating-qualifier rule, because two distinct words sharing a gloss
  cannot both ship as correct answers

Normalization for comparison strips a leading `to ` / `to be ` and lowercases, so
`to be cold` and `cold` are recognized as the same gloss.

Note what these checks deliberately do **not** claim. Distractor labels repeat
freely across the book by design — a pool-drawn distractor is another word's
gloss, which is the whole point — so global uniqueness applies only to prompts
and to correct answers. And the residual case of a distractor that is a genuine
unlisted synonym of the prompt word is **not** machine-checkable from the shipped
content alone, since it would require every valid meaning of every prompt word,
which is precisely the private corpus. The correct-answer uniqueness check
catches the collisions the corpus knows about; anything beyond that is caught in
human review, not by the build.

## Pipeline and sequencing

1. **Pilot — unit-01 end to end.** 20 words in 3 quizzes: 20 questions, 80
   options, 60 distractor decisions. Authored, validated, then reviewed by the
   user for content accuracy _and_ clicked through in the running app.
2. **Sign-off gate.** The pilot establishes the worked reference. A systemic
   mistake in the conventions gets caught once here rather than 40 times later.
3. **Scale to units 2–10.** Authored per unit against unit-01 as the reference,
   with the validation checks as the mechanical gate, followed by a review pass.

### Verification

- `npm test` — 36 existing tests plus the new integrity checks
- `npm run validate:content` — content gate on the real shipped files
- `npm run dev` — click through new quizzes in the real app
- Inspect every new JSON file for copyrighted content before `git add`; there is
  no `.gitignore` safety net, only the rule

## Out of scope

- **EN→KO direction.** Needs no code changes — `prompt` and choice labels are
  plain strings — but the qualifier burden moves into the prompt and the styling
  becomes lopsided. Revisit after learner testing.
- **Typed-translation and reading question types.** These need a new schema
  variant, grader and view, per the deferred list in the
  [content model spec](./2026-08-12-book-unit-quiz-content-model-design.md).
- **Units 11–20.** Deliberately held back until units 1–10 are tested with real
  learners.
- **A book picker on `/`.** Only one book ships, and `index.vue` lands on the
  first book.
