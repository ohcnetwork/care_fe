import { expect, test } from "@playwright/test";
import { openFixtureEncounter } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Diagnostic Reports Tab", () => {
  test.beforeEach(async ({ page }) => {
    await openFixtureEncounter(page);
  });

  test("should open the diagnostic reports tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Diagnostic Reports" }).click();
    await expect(page).toHaveURL(/\/diagnostic_reports$/);

    await expect(
      page.getByRole("tabpanel", { name: "Diagnostic Reports" }),
    ).toBeVisible();
  });
});
