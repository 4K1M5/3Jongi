import { computed, ref } from 'vue'
import type { Unit } from '~~/core/domain/models'
import {
  answerAndAdvance,
  createQuizSession,
  currentQuestion,
  isFinished,
  scoreQuiz,
} from '~~/core/domain/quiz'

/** Wraps the pure quiz logic in reactive state for the UI to bind to. */
export function useQuizSession(unit: Unit) {
  const session = ref(createQuizSession(unit))

  const question = computed(() => currentQuestion(session.value))
  const finished = computed(() => isFinished(session.value))
  const answeredCount = computed(() => session.value.currentIndex)
  const totalCount = computed(() => unit.questions.length)
  const result = computed(() => (finished.value ? scoreQuiz(session.value) : null))

  function answer(choiceId: string): void {
    const question = currentQuestion(session.value)
    if (!question) return
    session.value = answerAndAdvance(session.value, question.id, choiceId)
  }

  function restart(): void {
    session.value = createQuizSession(unit)
  }

  return { session, question, finished, answeredCount, totalCount, result, answer, restart }
}
