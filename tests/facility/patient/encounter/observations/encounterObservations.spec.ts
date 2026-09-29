import { expect, test } from "@playwright/test";
import { openFixtureEncounter } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Observations Tab", () => {
  test.beforeEach(async ({ page }) => {
    await openFixtureEncounter(page);
  });

  test("should display the observations tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Observations" }).click();
    await expect(page).toHaveURL(/\/observations$/);

    await expect(
      page.getByRole("tabpanel", { name: "Observations" }),
    ).toBeVisible();
  });
});
