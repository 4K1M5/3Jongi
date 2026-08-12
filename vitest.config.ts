import { defineConfig } from 'vitest/config'

// The domain and infrastructure layers are plain TypeScript, so they run under
// a plain Node environment — no Nuxt/Vue test harness needed.
export default defineConfig({
  test: {
    include: ['core/**/*.test.ts'],
    environment: 'node',
  },
})
