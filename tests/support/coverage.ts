import { Page, test as base } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Collects code coverage from the page's window.__coverage__ object
 * This is injected by vite-plugin-istanbul during the build process
 */
export async function collectCoverage(page: Page) {
  return await page.evaluate(() => (window as any).__coverage__);
}

/**
 * Saves coverage data to the .nyc_output directory
 * Coverage from multiple tests is merged by nyc
 */
export async function saveCoverage(
  page: Page,
  testName: string,
): Promise<void> {
  const coverage = await collectCoverage(page);
  if (!coverage) {
    return;
  }

  const outputDir = path.join(process.cwd(), ".nyc_output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const coverageFile = path.join(
    outputDir,
    `coverage-${sanitizedTestName}-${Date.now()}.json`,
  );

  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
}

/**
 * Extended Playwright test with automatic coverage collection
 * Usage: import { test } from './support/coverage';
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    // Collect coverage after each test
    try {
      await saveCoverage(page, testInfo.title);
    } catch (error) {
      console.warn("Failed to collect coverage:", error);
    }
  },
});

export { expect } from "@playwright/test";
