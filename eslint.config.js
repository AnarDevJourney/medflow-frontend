import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs["flat/recommended"],
      prettier, // formatting is Prettier's job
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The tablesync package must not know about MedFlow: no app aliases,
    // no app libraries — only react, antd, @ant-design/icons, @dnd-kit
    files: ["src/packages/tablesync/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^@(components|features|hooks|lib|router|store|styles|models|utils)/",
              message: "tablesync is app-independent",
            },
            {
              regex:
                "^(react-i18next|i18next|@tanstack/|axios|react-redux|@reduxjs/|react-router)",
              message: "not a tablesync dependency",
            },
          ],
        },
      ],
    },
  },
]);
