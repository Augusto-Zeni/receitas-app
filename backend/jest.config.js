/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/src/__tests__/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^../prisma$': '<rootDir>/src/__mocks__/prisma.ts',
    '^../../prisma$': '<rootDir>/src/__mocks__/prisma.ts',
    '^../services/emailService$': '<rootDir>/src/__mocks__/emailService.ts',
  },
  clearMocks: true,
}
