<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Unit } from '~~/core/domain/models'

const props = defineProps<{ bookId: string; unit: Unit }>()

const { progress: progressRepository } = useRepositories()

const totalQuizzes = computed(() => props.unit.quizzes.length)
const completedCount = ref(0)
const hasCompleted = computed(() => completedCount.value > 0)

onMounted(async () => {
  const stored = await Promise.all(
    props.unit.quizzes.map((quiz) =>
      progressRepository.getQuizProgress({
        bookId: props.bookId,
        unitId: props.unit.id,
        quizId: quiz.id,
      }),
    ),
  )
  completedCount.value = stored.filter((progress) => progress?.completedAt).length
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-medium">{{ unit.title }}</h2>
        <UBadge
          v-if="hasCompleted"
          :label="`${completedCount}/${totalQuizzes} done`"
          color="secondary"
          variant="subtle"
        />
      </div>
    </template>

    <p class="text-sm text-muted">{{ totalQuizzes }} quizzes</p>

    <template #footer>
      <UButton
        :to="`/books/${bookId}/${unit.id}`"
        label="Open unit"
        trailing-icon="i-lucide-arrow-right"
      />
    </template>
  </UCard>
</template>
