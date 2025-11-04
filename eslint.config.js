import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import ts from 'typescript-eslint'

export default [
  // Global ignores
  {
    ignores: [
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      '.env*',
      '*.tsbuildinfo',
      'coverage/**',
      '*.log',
      '.DS_Store',
      '.vscode/**',
      '.idea/**',
      '*.swp',
      '*.swo',
      '*.tmp',
      '*.temp',
      // Allow scripts and tests to use require() for Node.js compatibility
      'scripts/**',
      'tests/**/*.js',
      'tests/**/*.cjs',
      '**/*.config.js',
      '**/*.config.ts',
      'jest.setup.ts',
      'jest.config.*'
    ]
  },
  nextPlugin.configs['core-web-vitals'],
  ...ts.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      // Allow require() in configuration files and scripts
      "@typescript-eslint/no-require-imports": "off",
      // Allow any types in test files and mocks
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Specific rules for source code (stricter)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]