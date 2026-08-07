import { expect, test } from "@playwright/test";
import {
  clickTabOrMenuItem,
  openFirstInProgressEncounter,
} from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Devices Tab", () => {
  // The associate test mutates the shared fixture encounter, so run this file's
  // tests serially in one worker for deterministic ordering.
  test.describe.configure({ mode: "serial" });

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await openFirstInProgressEncounter(page, facilityId);
    await clickTabOrMenuItem(page, "Devices");
    await expect(page).toHaveURL(/\/devices$/);
  });

  test("should display the devices tab with an associate action", async ({
    page,
  }) => {
    await expect(page.getByRole("tabpanel", { name: "Devices" })).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Associate a device to this encounter",
      }),
    ).toBeVisible();
  });

  test("should associate a device with the encounter", async ({ page }) => {
    await page
      .getByRole("button", { name: "Associate a device to this encounter" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Associate device" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("combobox", { name: /select device/i }).click();
    await page.getByRole("option").first().click();

    const associate = dialog.getByRole("button", {
      name: "Associate",
      exact: true,
    });
    await expect(associate).toBeEnabled();
    await associate.click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("No devices available")).toBeHidden();
  });
});
