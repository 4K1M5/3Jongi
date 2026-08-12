<script setup lang="ts">
import { onMounted, watch } from 'vue'
import type { Unit } from '~~/core/domain/models'

const props = defineProps<{ unit: Unit }>()

const { session, question, finished, answeredCount, totalCount, result, answer, restart }
  = useQuizSession(props.unit)
const { load, record } = useUnitProgress(props.unit.id)

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

      <MultipleChoiceQuestionView
        v-if="question"
        :key="question.id"
        :question="question"
        @answer="answer"
      />
    </template>

    <QuizResultSummary
      v-else-if="result"
      :unit="unit"
      :session="session"
      :result="result"
      @restart="restart"
    />
  </div>
</template>
