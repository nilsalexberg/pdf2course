// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],

  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseKey: process.env.SUPABASE_KEY,
      siteUrl: process.env.SITE_URL,
    },
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/auth/login',
      callback: '/',
      exclude: ['/auth/register', '/auth/forgot-password', '/auth/reset-password'],
    },
  },
})
