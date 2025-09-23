const { verbose } = require("sqlite3");

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tests/tsconfig.json',
        useESM: false
      }
    ],
  },
  collectCoverageFrom: [
    'app/**/*.ts',
    '!app/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^#app/(.*)$': '<rootDir>/app/$1',
    '^#config/(.*)$': '<rootDir>/config/$1',
    '^#database/(.*)$': '<rootDir>/database/$1',
    '^#start/(.*)$': '<rootDir>/start/$1',
    '^#controllers/(.*)$': '<rootDir>/app/controllers/$1',
    '^#validators/(.*)$': '<rootDir>/app/validators/$1',
    '^#models/(.*)$': '<rootDir>/app/models/$1',
  },
  testTimeout: 30000,
  verbose: true,
};