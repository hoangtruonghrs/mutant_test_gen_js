module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'lib/**/*.js',
    'index.js',
    'cli.js',
    '!lib/**/*.test.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './lib/core/entities/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['jest-extended/all'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
