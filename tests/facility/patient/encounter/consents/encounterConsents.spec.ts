import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Consents Tab", () => {
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
    await clickTabOrMenuItem(page, "Consents");
    await expect(page).toHaveURL(/\/consents$/);
  });

  test("should display the consents tab with its empty state", async ({
    page,
  }) => {
    await expect(
      page.getByRole("tabpanel", { name: "Consents" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No Consents found" }),
    ).toBeVisible();
  });

  test("should have a search input for consents", async ({ page }) => {
    await expect(
      page.getByRole("textbox", { name: "Search existing consent" }),
    ).toBeVisible();
  });

  test("should open the consent creation form", async ({ page }) => {
    await page.getByRole("button", { name: "Add Consent" }).click();

    const dialog = page.getByRole("dialog", { name: "Add Consent" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio", { name: "Permit" })).toBeChecked();
    await expect(
      dialog.getByRole("combobox", { name: "Category" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("should create a consent with the default fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Consent" }).click();

    const dialog = page.getByRole("dialog", { name: "Add Consent" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "No Consents found" }),
    ).toBeHidden();
  });

  test("should open consents via the encounter actions command palette", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page).toHaveURL(/\/updates$/);

    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    const palette = page.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    await palette.getByRole("option", { name: /manage consents/i }).click();

    await expect(page).toHaveURL(/\/consents$/);
  });
});
