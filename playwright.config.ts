import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

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
  /* CI workers are controlled per-phase in the workflow (setup=1, chromium=4).
   * Locally, use all available cores. */
  workers: undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["html"], ["json", { outputFile: "test-results.json" }], ["list"]]
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
    // Setup project — runs serially because setup specs have ordering dependencies
    // (e.g., patient.setup.ts depends on facility.setup.ts for facilityId)
    { name: "setup", testMatch: /.*\.setup\.ts/, fullyParallel: false },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // On CI, setup runs as a separate step (--workers=1) before chromium (--workers=4).
      // Locally, Playwright handles the dependency ordering automatically.
      dependencies: process.env.CI ? [] : ["setup"],
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
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
