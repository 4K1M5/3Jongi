<script setup lang="ts">
import { onMounted, watch } from 'vue'
import type { Quiz } from '~~/core/domain/models'

const props = defineProps<{ quiz: Quiz; bookId: string; unitId: string }>()

const { session, question, finished, answeredCount, totalCount, result, answer, restart }
  = useQuizSession(props.quiz)
const { load, record } = useQuizProgress({
  bookId: props.bookId,
  unitId: props.unitId,
  quizId: props.quiz.id,
})

onMounted(load)

// Persist once, when the quiz transitions to finished.
watch(finished, async (isDone) => {
  if (isDone && result.value) await record(result.value)
})
</script>

<template>
  <div>
    <template v-if="!finished">
      <div class="mb-8 flex items-center gap-3">
        <UProgress :model-value="answeredCount" :max="totalCount" class="flex-1" />
        <span class="shrink-0 text-sm text-muted">{{ answeredCount }} / {{ totalCount }}</span>
      </div>

      <QuestionView
        v-if="question"
        :key="question.id"
        :question="question"
        @answer="answer"
      />
    </template>

    <QuizResultSummary
      v-else-if="result"
      :quiz="quiz"
      :session="session"
      :result="result"
      :unit-path="`/books/${bookId}/${unitId}`"
      @restart="restart"
    />
  </div>
</template>
