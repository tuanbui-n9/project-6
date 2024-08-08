import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 0,
      'no-case-declarations': 0,
      'no-underscore-dangle': 0,
      'no-restricted-syntax': 0,
      'max-len': 0,
      'prefer-destructuring': 0,
    },
  },
]
