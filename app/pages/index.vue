<script setup lang="ts">
import { computed } from 'vue'

const { content } = useRepositories()
const { data: books } = await useAsyncData('books', () => content.listBooks())

// One book today, so land directly on its units. A book picker is added when a
// second book exists (see the design spec).
const book = computed(() => books.value?.[0] ?? null)
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold">{{ book?.title ?? 'Units' }}</h1>
      <p class="text-muted">Pick a unit to see its quizzes.</p>
    </div>

    <div v-if="book" class="grid gap-4 sm:grid-cols-2">
      <UnitCard
        v-for="unit in book.units"
        :key="unit.id"
        :book-id="book.id"
        :unit="unit"
      />
    </div>
  </UContainer>
</template>
