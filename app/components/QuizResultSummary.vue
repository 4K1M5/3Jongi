<script setup lang="ts">
import { computed } from 'vue'
import type { Unit } from '~~/core/domain/models'
import type { QuizResult, QuizSession } from '~~/core/domain/quiz'
import { isCorrect } from '~~/core/domain/quiz'

const props = defineProps<{ unit: Unit; session: QuizSession; result: QuizResult }>()
const emit = defineEmits<{ restart: [] }>()

const percent = computed(() => Math.round(props.result.score * 100))

const review = computed(() =>
  props.unit.questions.map((question) => {
    const chosen = question.choices.find((choice) => choice.id === props.session.answers[question.id])
    const correct = question.choices.find((choice) => choice.id === question.correctChoiceId)
    return {
      id: question.id,
      prompt: question.prompt,
      chosenLabel: chosen?.label ?? '—',
      correctLabel: correct?.label ?? '—',
      isCorrect: isCorrect(question, props.session.answers[question.id]),
    }
  }),
)
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest text-muted">Your score</p>
      <p class="text-5xl font-semibold text-primary">{{ percent }}%</p>
      <p class="text-muted">{{ result.correct }} of {{ result.total }} correct</p>
    </div>

    <ul class="divide-y divide-default rounded-lg border border-default">
      <li
        v-for="entry in review"
        :key="entry.id"
        class="flex items-center gap-3 px-4 py-3"
      >
        <UIcon
          :name="entry.isCorrect ? 'i-lucide-check' : 'i-lucide-x'"
          :class="entry.isCorrect ? 'text-primary' : 'text-error'"
          class="size-5 shrink-0"
        />
        <span class="text-lg font-medium">{{ entry.prompt }}</span>
        <span class="ml-auto text-sm text-muted">
          <template v-if="entry.isCorrect">{{ entry.correctLabel }}</template>
          <template v-else>{{ entry.chosenLabel }} → {{ entry.correctLabel }}</template>
        </span>
      </li>
    </ul>

    <div class="flex justify-center gap-3">
      <UButton
        label="Try again"
        icon="i-lucide-rotate-ccw"
        variant="soft"
        @click="emit('restart')"
      />
      <UButton to="/" label="Back to units" color="neutral" variant="ghost" />
    </div>
  </div>
</template>
