import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  content: [
    './app.vue',
    './app/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
