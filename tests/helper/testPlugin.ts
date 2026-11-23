import { type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const testPluginRemoteEntryUrl =
  "http://localhost:4000/test-plugin/remoteEntry.js";

/** Serves a remote entry from `tests/fixtures/plugin/` as the only plugin. */
async function mockPluginRemote(page: Page, fixture: string) {
  const remoteEntry = fs.readFileSync(
    path.resolve("tests/fixtures/plugin", fixture),
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

/** Loads `tests/fixtures/plugin/remoteEntry.js` as the only plugin. */
export async function mockTestPlugin(page: Page) {
  await mockPluginRemote(page, "remoteEntry.js");
}

/**
 * Loads `tests/fixtures/plugin/registeredGroupRemoteEntry.js` as the only
 * plugin. It registers the `care_test_plugin.slot_chart` question group.
 */
export async function mockRegisteredGroupPlugin(page: Page) {
  await mockPluginRemote(page, "registeredGroupRemoteEntry.js");
}
