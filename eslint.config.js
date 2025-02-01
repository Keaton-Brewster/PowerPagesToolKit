import globals from "globals";
import * as typescript from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config} */
const config = {
  languageOptions: {
    globals: { ...globals.browser, process: "readonly" },
    parser: typescript,
  },
  rules: {
    "no-undef": "error",
    "no-unused-vars": "warn",
  },
  ignores: ["./dist"],
};

export default config;
