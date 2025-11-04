import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import ts from 'typescript-eslint'

export default [
  nextPlugin.configs['core-web-vitals'],
  ...ts.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
]