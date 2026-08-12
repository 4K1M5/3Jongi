<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { content } = useRepositories()

const unitId = computed(() => String(route.params.unitId))

const { data: unit } = await useAsyncData(
  `unit:${unitId.value}`,
  () => content.getUnit(unitId.value),
)

if (!unit.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Unit "${unitId.value}" not found`,
    fatal: true,
  })
}
</script>

<template>
  <UContainer class="py-10">
    <UButton
      to="/"
      label="Units"
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="ghost"
      class="mb-6"
    />

    <h1 class="mb-8 text-xl font-semibold">{{ unit!.title }}</h1>

    <QuizRunner :unit="unit!" />
  </UContainer>
</template>
