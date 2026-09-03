import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import i18nextPlugin from "eslint-plugin-i18next";
import i18nextNoUndefinedTranslationKeysPlugin from "eslint-plugin-i18next-no-undefined-translation-keys";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import playwright from "eslint-plugin-playwright";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const namespaceMappingPath = path.join(__dirname, "namespaceMapping.json");
const namespaceMapping = {
  default: path.join(__dirname, "public/locale/en.json"),
};
fs.writeFileSync(
  namespaceMappingPath,
  JSON.stringify(namespaceMapping, null, 2),
);

const isPreCommit = process.env.PRE_COMMIT === "true";
const isProduction = process.env.NODE_ENV === "production";
const DEFAULT = true;

const dynamicRules = (ruleset, logKey) => {
  const appliedRule = Object.entries(ruleset).find(([rule, condition]) => {
    return condition === true;
  });
  if (appliedRule) {
    const [rule] = appliedRule;
    if (logKey) {
      console.log(`${logKey} rule set to ${rule}`);
    }
    return rule;
  }
  if (logKey) {
    console.log(`${logKey} rule off`);
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
      // Auto-generated AI-tool hook/plugin configs, not part of the app's tsconfig
      ".opencode/**",
      ".codex/**",
      ".cursor/**",
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

      // Require rendering components to pass an ExtensionContexts.* value when rendering
      // extensions. Warns by default, errors on pre-commit.
      "no-restricted-syntax": [
        dynamicRules({ error: isPreCommit, warn: DEFAULT }),
        {
          selector:
            "CallExpression[callee.name=/^(getExtensionFieldsWithName|processExtensions|getExtensionProps|getCombinedExtensionProps)$/][arguments.length<2]",
          message:
            "Pass an ExtensionContexts.* value as the second argument. Create a new context if needed.",
        },
        {
          selector:
            "CallExpression[callee.name=/^use(Extensions|EntityExtensions)$/] > ObjectExpression:first-child:not(:has(Property[key.name='context']))",
          message:
            "Pass `context: ExtensionContexts.<slot>` in the options. Create a new context if needed.",
        },
      ],
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
      // React Compiler rules added to react-hooks v7 `recommended`. Surfaced as
      // warnings so the existing code is not blocked; address incrementally.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  // No Relative import paths rule
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
          rootDir: "src",
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
      "i18next-no-undefined-translation-keys":
        i18nextNoUndefinedTranslationKeysPlugin,
    },
    rules: {
      ...i18nextPlugin.configs.recommended.rules,
      "i18next/no-literal-string": [
        dynamicRules({
          error: isPreCommit || isProduction,
          warn: DEFAULT,
        }),
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
      "i18next-no-undefined-translation-keys/no-undefined-translation-keys": [
        dynamicRules({
          error: isPreCommit || isProduction,
          warn: DEFAULT,
        }),
        {
          namespaceTranslationMappingFile: namespaceMappingPath,
          defaultNamespace: "default",
        },
      ],
    },
  },

  // Playwright-specific rules
  {
    files: ["tests/**/*.ts", "playwright.config.ts"],
    plugins: { playwright },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tests/tsconfig.json",
      },
    },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      // Forward gates (no existing usages): promote to error so CI actually
      // rejects new usages (these are only `warn` in flat/recommended).
      "playwright/no-wait-for-selector": "error",
      "playwright/no-element-handle": "error",
      "playwright/no-eval": "error",
      "playwright/no-page-pause": "error",
      // Forward gate (no existing usages): disallow test-id selectors in favour
      // of role/label/text locators.
      "playwright/no-restricted-locators": [
        "error",
        [
          {
            type: "getByTestId",
            message:
              "Avoid test IDs — use role/label/text locators (getByRole, getByLabel, getByText).",
          },
        ],
      ],
      // Anti-flakiness rules: enforced as errors.
      "playwright/no-networkidle": "error",
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-force-option": "error",
      // Correctness/style rules: enforced as errors (auto-fixable / low-noise).
      "playwright/no-useless-not": "error",
      "playwright/prefer-to-have-count": "error",
      "playwright/no-useless-await": "error",
      "playwright/no-unused-locators": "error",
      "playwright/prefer-web-first-assertions": "error",
      "playwright/consistent-spacing-between-blocks": "error",
      // Disabled: .first()/.last()/.nth() are idiomatic Playwright, and the
      // rest have many legitimate violations (helper-driven tests, viewport
      // branches, intentional skips). Preferring semantic locators / adding
      // assertions stays as review guidance, not a lint gate.
      "playwright/no-nth-methods": "off",
      "playwright/expect-expect": "off",
      "playwright/no-conditional-in-test": "off",
      "playwright/no-conditional-expect": "off",
      "playwright/no-skipped-test": "off",
    },
  },

  // Add prettier recommended config last
  eslintPluginPrettierRecommended,
];

export default config;
