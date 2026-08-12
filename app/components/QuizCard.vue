<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Quiz } from '~~/core/domain/models'

const props = defineProps<{ bookId: string; unitId: string; quiz: Quiz }>()

const { progress, load } = useQuizProgress({
  bookId: props.bookId,
  unitId: props.unitId,
  quizId: props.quiz.id,
})
onMounted(load)

const bestPercent = computed(() => Math.round(progress.value.bestScore * 100))
const hasAttempts = computed(() => progress.value.attempts > 0)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-medium">{{ quiz.title }}</h3>
        <UBadge
          v-if="hasAttempts"
          :label="`Best ${bestPercent}%`"
          color="secondary"
          variant="subtle"
        />
      </div>
    </template>

    <p class="text-sm text-muted">{{ quiz.questions.length }} questions</p>

    <template #footer>
      <UButton
        :to="`/books/${bookId}/${unitId}/${quiz.id}`"
        label="Start quiz"
        trailing-icon="i-lucide-arrow-right"
      />
    </template>
  </UCard>
</template>
