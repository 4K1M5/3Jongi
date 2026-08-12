import { computed, ref } from 'vue'
import type { Quiz } from '~~/core/domain/models'
import {
  answerAndAdvance,
  createQuizSession,
  currentQuestion,
  isFinished,
  scoreQuiz,
} from '~~/core/domain/quiz'

/** Wraps the pure quiz logic in reactive state for the UI to bind to. */
export function useQuizSession(quiz: Quiz) {
  const session = ref(createQuizSession(quiz))

  const question = computed(() => currentQuestion(session.value))
  const finished = computed(() => isFinished(session.value))
  const answeredCount = computed(() => session.value.currentIndex)
  const totalCount = computed(() => quiz.questions.length)
  const result = computed(() => (finished.value ? scoreQuiz(session.value) : null))

  function answer(choiceId: string): void {
    const current = currentQuestion(session.value)
    if (!current) return
    session.value = answerAndAdvance(session.value, current.id, choiceId)
  }

  function restart(): void {
    session.value = createQuizSession(quiz)
  }

  return { session, question, finished, answeredCount, totalCount, result, answer, restart }
}
