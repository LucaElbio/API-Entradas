/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^#controllers/(.*)$': '<rootDir>/app/controllers/$1',
    '^#exceptions/(.*)$': '<rootDir>/app/exceptions/$1',
    '^#models/(.*)$': '<rootDir>/app/models/$1',
    '^#validators/(.*)$': '<rootDir>/app/validators/$1',
    '^#start/(.*)$': '<rootDir>/start/$1',
    '^#config/(.*)$': '<rootDir>/config/$1',
    // Mapear import relativo de ESM en el controlador a TS durante tests
    '^\.\.\/\.\.\/models\/event\.js$': '<rootDir>/app/models/event.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
        useESM: false,
        diagnostics: true,
      },
    ],
  },
  testMatch: ['**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  verbose: true,
}
