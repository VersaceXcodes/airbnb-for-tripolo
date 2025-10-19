module.exports = {
  "testEnvironment": "node",
  "collectCoverageFrom": [
    "server.ts",
    "controllers/**/*.ts",
    "routes/**/*.ts",
    "middleware/**/*.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "setupFilesAfterEnv": [
    "./test/setup.ts"
  ],
  "preset": "ts-jest"
};