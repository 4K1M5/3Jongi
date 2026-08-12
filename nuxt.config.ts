// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  compatibilityDate: '2026-06-30',

  // Project Pages serve under https://<user>.github.io/3Jongi/, so production
  // assets and routes need the `/3Jongi/` base. Applied at build time (so the
  // prerenderer is base-aware); local `dev` stays at the default `/`.
  $production: {
    app: { baseURL: '/3Jongi/' },
  },

  // Static hosting on GitHub Pages: prerender every reachable route and let the
  // preset emit `.nojekyll` + `404.html`. Swap this preset for a Node host later
  // to turn on SSR and `/server/api` routes.
  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },
})
