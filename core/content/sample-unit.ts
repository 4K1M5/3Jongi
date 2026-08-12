import type { Unit } from '../domain/models'

/**
 * Original sample content used to prove the app end-to-end.
 *
 * These are generic, everyday words — NOT derived from any textbook or
 * copyrighted vocabulary list. Real per-unit content is generated separately
 * and reviewed before publishing (see CLAUDE.local.md).
 */
export const sampleUnits: Unit[] = [
  {
    id: 'sample-1',
    title: 'Sample Unit · Everyday words',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice-meaning',
        prompt: '물',
        choices: [
          { id: 'c1', label: 'water' },
          { id: 'c2', label: 'fire' },
          { id: 'c3', label: 'book' },
          { id: 'c4', label: 'sky' },
        ],
        correctChoiceId: 'c1',
      },
      {
        id: 'q2',
        type: 'multiple-choice-meaning',
        prompt: '책',
        choices: [
          { id: 'c1', label: 'chair' },
          { id: 'c2', label: 'book' },
          { id: 'c3', label: 'door' },
          { id: 'c4', label: 'road' },
        ],
        correctChoiceId: 'c2',
      },
      {
        id: 'q3',
        type: 'multiple-choice-meaning',
        prompt: '사람',
        choices: [
          { id: 'c1', label: 'animal' },
          { id: 'c2', label: 'city' },
          { id: 'c3', label: 'person' },
          { id: 'c4', label: 'friend' },
        ],
        correctChoiceId: 'c3',
      },
      {
        id: 'q4',
        type: 'multiple-choice-meaning',
        prompt: '하늘',
        choices: [
          { id: 'c1', label: 'sky' },
          { id: 'c2', label: 'sea' },
          { id: 'c3', label: 'mountain' },
          { id: 'c4', label: 'star' },
        ],
        correctChoiceId: 'c1',
      },
      {
        id: 'q5',
        type: 'multiple-choice-meaning',
        prompt: '밥',
        choices: [
          { id: 'c1', label: 'tea' },
          { id: 'c2', label: 'rice / meal' },
          { id: 'c3', label: 'soup' },
          { id: 'c4', label: 'bread' },
        ],
        correctChoiceId: 'c2',
      },
    ],
  },
]
