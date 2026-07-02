import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: ["**/*.js", "dist/**", "build/**", "cdk.out/**"],
  },
  ...typescriptEslint.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  prettierRecommended,
];
