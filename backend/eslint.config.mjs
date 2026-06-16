import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

const commonRules = {
  ...tseslint.configs.recommended.rules,
  semi: ['error', 'never'],
  quotes: ['error', 'single'],
  'no-trailing-spaces': 'error',
  'eol-last': ['error', 'always']
}

export default [
  {
    files: ['src/**/*.ts'],
    ignores: ['src/__tests__/**', 'src/__mocks__/**'],
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
    rules: commonRules
  },
  {
    files: ['src/__tests__/**/*.ts', 'src/__mocks__/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './src/__tests__/tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: commonRules
  }
]
