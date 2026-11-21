import { expect, test } from "@playwright/test";
import { openFixtureEncounter } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Tabs Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await openFixtureEncounter(page);
  });

  test("should navigate between encounter tabs without errors", async ({
    page,
  }) => {
    const tabs: [string, RegExp][] = [
      ["Observations", /\/observations$/],
      ["Medicines", /\/medicines$/],
      ["Service Requests", /\/service_requests$/],
      ["Files", /\/files$/],
      ["Notes", /\/notes$/],
      ["Overview", /\/updates$/],
    ];
    for (const [tabName, url] of tabs) {
      await page.getByRole("tab", { name: tabName }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByText(/something went wrong/i)).toBeHidden();
    }
  });
});
