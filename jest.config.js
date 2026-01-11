module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["/tests//.test.ts"],
  collectCoverageFrom: ["src/**/.ts", "!src/index.ts"],
};
