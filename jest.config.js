/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  rootDir: './',
  moduleNameMapper: {
    '^keck-forms/(.*)$': '<rootDir>/src/$1',
  },
};
