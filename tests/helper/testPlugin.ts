import { type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const testPluginRemoteEntryUrl =
  "http://localhost:4000/test-plugin/remoteEntry.js";

/** Loads `tests/fixtures/plugin/remoteEntry.js` as the only plugin. */
export async function mockTestPlugin(page: Page) {
  const remoteEntry = fs.readFileSync(
    path.resolve("tests/fixtures/plugin/remoteEntry.js"),
    "utf-8",
  );
  await page.route("**/api/v1/plug_config/", (route) =>
    route.fulfill({
      json: {
        configs: [
          {
            slug: "care_test_plugin",
            meta: { url: testPluginRemoteEntryUrl },
          },
        ],
      },
    }),
  );
  await page.route(testPluginRemoteEntryUrl, (route) =>
    route.fulfill({
      body: remoteEntry,
      contentType: "application/javascript",
    }),
  );
}
