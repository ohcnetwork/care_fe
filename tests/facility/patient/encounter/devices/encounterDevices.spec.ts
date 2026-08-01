import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Devices Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
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
