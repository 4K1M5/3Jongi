<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MultipleChoiceQuestion } from '~~/core/domain/models'

const props = defineProps<{ question: MultipleChoiceQuestion }>()
const emit = defineEmits<{ answer: [choiceId: string] }>()

const selectedChoiceId = ref<string>()

const items = computed(() =>
  props.question.choices.map((choice) => ({ label: choice.label, value: choice.id })),
)

function submit(): void {
  if (!selectedChoiceId.value) return
  emit('answer', selectedChoiceId.value)
  selectedChoiceId.value = undefined
}
</script>

<template>
  <div class="space-y-8">
    <p class="text-center text-4xl font-semibold">
      {{ question.prompt }}
    </p>

    <URadioGroup
      v-model="selectedChoiceId"
      :items="items"
      size="lg"
      variant="card"
    />

    <div class="flex justify-end">
      <UButton
        label="Next"
        trailing-icon="i-lucide-arrow-right"
        size="lg"
        :disabled="!selectedChoiceId"
        @click="submit"
      />
    </div>
  </div>
</template>
