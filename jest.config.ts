// https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#basic-usage
import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  verbose: false,
  preset: "ts-jest", // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  testEnvironment: "node",
};

export default jestConfig;
