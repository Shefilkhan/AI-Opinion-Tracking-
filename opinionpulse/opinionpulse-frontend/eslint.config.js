import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // eslint-plugin-react-hooks v7 ships the React Compiler diagnostics as
      // errors in flat/recommended. This codebase predates a full React
      // Compiler migration, so the pervasive, non-behavioural ones are kept as
      // warnings (still visible, not build-blocking) to be adopted
      // incrementally. Correctness-relevant rules stay errors:
      // react-hooks/purity, react-hooks/rules-of-hooks and
      // @typescript-eslint/no-explicit-any are intentionally NOT downgraded.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
