/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        isolatedModules: false,
      },
    ],
  },
  // ts-jest preset handles TypeScript transformation; no babel-jest needed
  transformIgnorePatterns: ['/node_modules/(?!jose)/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@radix-ui/react-dialog': '<rootDir>/tests/__mocks__/@radix-ui/react-dialog.tsx',
    '@radix-ui/react-alert-dialog': '<rootDir>/tests/__mocks__/@radix-ui/react-alert-dialog.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup-tests.ts', '<rootDir>/jest.setup.ts'],
  globals: {},
};
