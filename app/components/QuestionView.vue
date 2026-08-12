<script setup lang="ts">
import type { Question } from '~~/core/domain/models'

// Rendering seam: maps a question's `type` to the component that renders it.
// Add a new question type by adding a branch here plus its view component —
// nothing else in the quiz runner changes.
defineProps<{ question: Question }>()
const emit = defineEmits<{ answer: [answer: string] }>()
</script>

<template>
  <MultipleChoiceQuestionView
    v-if="question.type === 'multiple-choice-meaning'"
    :question="question"
    @answer="(choiceId) => emit('answer', choiceId)"
  />

  <UAlert
    v-else
    icon="i-lucide-triangle-alert"
    color="warning"
    variant="soft"
    :title="`Unsupported question type: ${question.type}`"
  />
</template>
