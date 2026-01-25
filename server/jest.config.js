/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
    },
    setupFilesAfterEnv: ['./tests/setup.ts'],
    testMatch: ['**/*.test.ts'],
};
