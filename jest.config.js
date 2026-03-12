/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Prefer .ts over .js so artwork-detection.ts wins over .js twin
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Transform ESM .js files (auto-tag.js etc.) through ts-jest
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "ts-jest",
  },
};
