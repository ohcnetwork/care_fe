import { expect, test } from "@playwright/test";
import {
  clickTabOrMenuItem,
  openFirstInProgressEncounter,
} from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Consents Tab", () => {
  // The create test mutates the shared fixture encounter, so run this file's
  // tests in declaration order (empty-state assertions before the create) in a
  // single worker instead of in parallel.
  test.describe.configure({ mode: "serial" });

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await openFirstInProgressEncounter(page, facilityId);
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
