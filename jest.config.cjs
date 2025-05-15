module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel)/)'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  snapshotSerializers: [
    'jest-serializer-html-string'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};