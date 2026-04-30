module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['./src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/fileMock.cjs', // ignore CSS imports
  },
};