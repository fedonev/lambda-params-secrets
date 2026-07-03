// https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#basic-usage
import { createDefaultPreset, type JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  ...createDefaultPreset({ tsconfig: "tsconfig.json" }),
  verbose: false,
  testEnvironment: "node",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "mts",
    "cts",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "json",
    "node",
  ],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

export default jestConfig;
