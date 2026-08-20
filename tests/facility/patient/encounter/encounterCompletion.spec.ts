import { expect, test } from "@playwright/test";
import { openFixtureEncounter } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Completion", () => {
  test.beforeEach(async ({ page }) => {
    await openFixtureEncounter(page);
  });

  test("should prompt for confirmation when marking an encounter as completed", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    const palette = page.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    await palette.getByRole("option", { name: /mark as completed/i }).click();

    // A confirmation dialog guards this terminal action. Verify it appears
    // (without confirming, to keep the shared fixture encounter in progress).
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await expect(
      confirmDialog.getByRole("button", { name: /mark as complete/i }),
    ).toBeVisible();
  });

  test("should open the encounter actions command palette", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    await expect(
      page.getByRole("dialog", { name: "Command Palette" }),
    ).toBeVisible();
  });
});
