import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import i18Next from "eslint-plugin-i18next";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "**/dist",
      "**/public",
      "**/lib",
      "**/build",
      "**/*.bs.js",
      "**/*.gen.tsx",
      "**/*.res",
      "**/*.css",
      "**/*.csv",
      "**/Dockerfile",
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:i18next/recommended",
      "plugin:prettier/recommended",
    ),
  ),
  {
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      i18next: fixupPluginRules(i18Next),
      "no-relative-import-paths": noRelativeImportPaths,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "no-unused-vars": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",

      "i18next/no-literal-string": [
        "warn",
        {
          mode: "jsx-only",

          "jsx-attributes": {
            include: ["label", "placeholder", "error", "title"],
            exclude: [".*"],
          },

          callees: {
            exclude: [".*"],
          },
        },
      ],

      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
          prefix: "@",
        },
      ],
    },
  },
];
