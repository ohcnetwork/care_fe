import { expect, test } from "@playwright/test";
import { openFirstInProgressEncounter } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Completion", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await openFirstInProgressEncounter(page, facilityId);
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
