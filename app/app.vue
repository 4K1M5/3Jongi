<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en' },
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
})

useSeoMeta({
  title: '3Jongi',
  description: 'A per-unit quiz companion for King Sejong Institute Korean.',
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="text-lg font-semibold">
          3<span class="text-primary">Jongi</span>
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          A per-unit quiz companion · original content only
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
