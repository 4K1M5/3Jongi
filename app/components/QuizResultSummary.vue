<script setup lang="ts">
import { computed } from 'vue'
import type { Question, Quiz } from '~~/core/domain/models'
import type { QuizResult, QuizSession } from '~~/core/domain/quiz'
import { grade } from '~~/core/domain/quiz'

const props = defineProps<{
  quiz: Quiz
  session: QuizSession
  result: QuizResult
  unitPath: string
}>()
const emit = defineEmits<{ restart: [] }>()

const percent = computed(() => Math.round(props.result.score * 100))

/** Builds a review row per question, dispatching label lookup on question type. */
function reviewEntry(question: Question, answer: string | undefined) {
  const isCorrect = grade(question, answer)
  if (question.type === 'multiple-choice-meaning') {
    const chosen = question.choices.find((choice) => choice.id === answer)
    const correct = question.choices.find((choice) => choice.id === question.correctChoiceId)
    return {
      id: question.id,
      prompt: question.prompt,
      isCorrect,
      chosenLabel: chosen?.label ?? '—',
      correctLabel: correct?.label ?? '—',
    }
  }
  return { id: question.id, prompt: question.prompt, isCorrect, chosenLabel: '—', correctLabel: '—' }
}

const review = computed(() =>
  props.quiz.questions.map((question) => reviewEntry(question, props.session.answers[question.id])),
)
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest text-muted">Your score</p>
      <p class="font-serif text-5xl font-semibold tabular-nums text-primary">{{ percent }}%</p>
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
      <UButton :to="unitPath" label="Back to quizzes" color="neutral" variant="ghost" />
    </div>
  </div>
</template>
