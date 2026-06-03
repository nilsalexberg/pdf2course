import pluginVue from 'eslint-plugin-vue';
import vueConfigTs from '@vue/eslint-config-typescript';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'dist/**']
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueConfigTs(),
  prettierConfig,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
];
