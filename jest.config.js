module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  // Keep test output focused and avoid watching node_modules.
  testPathIgnorePatterns: ["/node_modules/"],
};
