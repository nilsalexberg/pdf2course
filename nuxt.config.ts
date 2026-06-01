// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      siteUrl: process.env.SITE_URL,
    },
  },
})
