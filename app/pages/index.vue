<script setup lang="ts">
const { content } = useRepositories()
const { data: units } = await useAsyncData('units', () => content.listUnits())
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold">Units</h1>
      <p class="text-muted">Pick a unit to start a quick quiz.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UnitCard
        v-for="unit in units ?? []"
        :key="unit.id"
        :unit="unit"
      />
    </div>
  </UContainer>
</template>
