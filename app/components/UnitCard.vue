<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Unit } from '~~/core/domain/models'

const props = defineProps<{ unit: Unit }>()

const { progress, load } = useUnitProgress(props.unit.id)
onMounted(load)

const bestPercent = computed(() => Math.round(progress.value.bestScore * 100))
const hasAttempts = computed(() => progress.value.attempts > 0)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-medium">{{ unit.title }}</h2>
        <UBadge
          v-if="hasAttempts"
          :label="`Best ${bestPercent}%`"
          color="secondary"
          variant="subtle"
        />
      </div>
    </template>

    <p class="text-sm text-muted">{{ unit.questions.length }} questions</p>

    <template #footer>
      <UButton
        :to="`/units/${unit.id}`"
        label="Start quiz"
        trailing-icon="i-lucide-arrow-right"
      />
    </template>
  </UCard>
</template>
