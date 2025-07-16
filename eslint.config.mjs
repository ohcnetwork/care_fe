import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import i18nextPlugin from "eslint-plugin-i18next";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

const isPreCommit = process.env.PRE_COMMIT === "true";
const DEFAULT = true;

const dynamicRules = (ruleset) => {
  const appliedRule = Object.entries(ruleset).find(([rule, condition]) => {
    return condition === true;
  });
  if (appliedRule) {
    const [rule] = appliedRule;
    return rule;
  }
  return "off";
};

const config = [
  // Base configuration
  {
    ignores: [
      "**/dist",
      "**/public",
      "**/lib",
      "**/build",
      "**/*.css",
      "**/*.csv",
      "**/Dockerfile",
    ],
  },
  eslint.configs.recommended,

  // Global settings for all JavaScript/TypeScript files
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        React: true,
      },
      parser: tsParser,
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
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // TypeScript-specific rules
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-deprecated": dynamicRules({
        error: isPreCommit,
        warn: DEFAULT,
      }),
      "no-undef": "off",
    },
  },

  // React-specific rules
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "react/no-children-prop": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // No Relative import paths rule
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
          prefix: "@",
        },
      ],
    },
  },

  // i18next plugin rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      i18next: i18nextPlugin,
    },
    rules: {
      ...i18nextPlugin.configs.recommended.rules,
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
    },
  },

  // Cypress-specific rules
  {
    files: ["cypress/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./cypress/tsconfig.json",
      },
    },
  },

  // Add prettier recommended config last
  eslintPluginPrettierRecommended,
];

// console.log(config);

export default config;
