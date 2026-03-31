import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      semi: ['error', 'never'],
      '@typescript-eslint/semi': ['error', 'never'],
      quotes: ['error', 'single'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always']
    }
  }
]
