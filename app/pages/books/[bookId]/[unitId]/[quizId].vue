<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { content } = useRepositories()

const bookId = computed(() => String(route.params.bookId))
const unitId = computed(() => String(route.params.unitId))
const quizId = computed(() => String(route.params.quizId))

const { data: quiz } = await useAsyncData(
  `quiz:${bookId.value}:${unitId.value}:${quizId.value}`,
  () => content.getQuiz(bookId.value, unitId.value, quizId.value),
)

if (!quiz.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Quiz "${quizId.value}" not found`,
    fatal: true,
  })
}
</script>

<template>
  <UContainer class="py-10">
    <UButton
      :to="`/books/${bookId}/${unitId}`"
      label="Back to quizzes"
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="ghost"
      class="mb-6"
    />

    <h1 class="mb-8 text-xl font-semibold">{{ quiz!.title }}</h1>

    <QuizRunner :quiz="quiz!" :book-id="bookId" :unit-id="unitId" />
  </UContainer>
</template>
