import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

/** Dev server for the `vite-modules` project. */
const VITE_DEV_PORT = 4100;
const VITE_DEV_URL = `http://localhost:${VITE_DEV_PORT}`;
const VITE_MODULE_SPECS = [
  /fill\/fillScribeActions\.spec\.ts$/,
  /questionnaires\/questionnaireGroupValidation\.spec\.ts$/,
];

/**
 * Projects named with --project. Playwright starts every webServer entry, and
 * the dev server pre-bundles dependencies as soon as it starts, so only start
 * it when the run can include the vite-modules project.
 */
function readSelectedProjects(argv: string[]): string[] {
  const names: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--project=")) {
      names.push(arg.slice("--project=".length));
    } else if (arg === "--project") {
      // Playwright declares --project as variadic: take values up to the next flag.
      while (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        names.push(argv[++i]);
      }
    }
  }
  return names;
}

// Same matching as Playwright's filterProjects: case-insensitive, `*` wildcards.
function projectNameMatches(pattern: string, name: string): boolean {
  const escaped = pattern
    .toLowerCase()
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${escaped.join(".*")}$`).test(name.toLowerCase());
}

const selectedProjects = readSelectedProjects(process.argv);
const runsViteModules =
  selectedProjects.length === 0 ||
  selectedProjects.some((pattern) =>
    projectNameMatches(pattern, "vite-modules"),
  );
// The other projects use the preview build. Skip it only when every selected
// name is exactly vite-modules (a wildcard may also select other projects).
const runsPreviewProjects =
  selectedProjects.length === 0 ||
  selectedProjects.some((name) => name.toLowerCase() !== "vite-modules");

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",

  timeout: 60000,

  /* Global expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Global setup - refreshes tokens before test run */
  globalSetup: "./tests/globalSetup",

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,
  /* CI workers are controlled per-phase in the workflow.
   * Locally, use all available cores. */
  workers: undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["blob"], ["json", { outputFile: "test-results.json" }], ["list"]]
    : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4000",
    video: "on-first-retry",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Set navigation and action timeouts */
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup-auth",
      testMatch: /(?:auth|staff|nurse|facilityAdmin)\.setup\.ts$/,
      fullyParallel: true,
    },
    {
      name: "setup-facility",
      testMatch: /facility\.setup\.ts$/,
      dependencies: ["setup-auth"],
    },
    {
      name: "setup-patient",
      testMatch: /patient\.setup\.ts$/,
      dependencies: ["setup-facility"],
    },
    {
      name: "setup-account",
      testMatch: /patientAccount\.setup\.ts$/,
      dependencies: ["setup-patient"],
    },
    {
      name: "setup-data",
      testMatch: /(?:locationInventory|questionnaire)\.setup\.ts$/,
      dependencies: ["setup-auth", "setup-facility"],
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: VITE_MODULE_SPECS,
      dependencies: process.env.CI
        ? []
        : [
            "setup-auth",
            "setup-facility",
            "setup-patient",
            "setup-account",
            "setup-data",
          ],
    },
    // Specs that import source modules (`/src/...`) into the page. Only the
    // Vite dev server serves those; the preview build does not.
    {
      name: "vite-modules",
      testMatch: VITE_MODULE_SPECS,
      use: { ...devices["Desktop Chrome"], baseURL: VITE_DEV_URL },
      // The first spec to load on a cold dev server waits up to 45s for
      // dependency pre-bundling inside beforeEach, which counts against this.
      timeout: 120000,
      // These specs answer every API call themselves, so they need neither a
      // signed-in user nor backend fixtures.
      dependencies: [],
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    //   dependencies: ["setup"],
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    //   dependencies: ["setup"],
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    ...(runsPreviewProjects
      ? [
          {
            command: "npm run preview",
            url: "http://localhost:4000",
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
          },
        ]
      : []),
    ...(runsViteModules
      ? [
          {
            command: `npm run dev -- --port ${VITE_DEV_PORT} --strictPort`,
            url: VITE_DEV_URL,
            // CI runs Playwright with NODE_ENV=production, which would put the dev
            // server in production mode and flip import.meta.env.DEV for the specs.
            env: { NODE_ENV: "development" },
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
          },
        ]
      : []),
  ],
});
