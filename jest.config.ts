// https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#basic-usage
import { createDefaultPreset, type JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  ...createDefaultPreset({ tsconfig: "tsconfig.test.json" }),
  verbose: false,
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

export default jestConfig;
