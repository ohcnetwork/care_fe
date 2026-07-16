import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Service History", () => {
  let facilityId: string;
  let notes: string;
  let updatedNotes: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    notes = faker.lorem.sentence();
    updatedNotes = faker.lorem.sentence();
    await page.goto(`/facility/${facilityId}/settings/devices`);
  });

  test("Open random device and create a new service record", async ({
    page,
  }) => {
    // Wait for device list to load by checking for at least one device card
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible({ timeout: 10000 });

    await firstDeviceLink.click();

    // Wait for device details page to load by checking for Add Service Record button
    await expect(
      page.getByRole("button", { name: "Add Service Record" }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();
  });

  test("Edit an existing service record and verify changes", async ({
    page,
  }) => {
    // Wait for device list to load by checking for at least one device card
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible({ timeout: 10000 });

    await firstDeviceLink.click();

    // Wait for device details page to load by checking for Add Service Record button
    await expect(
      page.getByRole("button", { name: "Add Service Record" }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();

    // Wait for the Add sheet to fully close before opening Edit; otherwise its
    // controls linger in the DOM during the close animation and collide with
    // the edit sheet's controls.
    await expect(page.getByRole("button", { name: "Save" })).toBeHidden();

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: notes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    // With the Add sheet closed, the edit sheet is the only open dialog. Use
    // .last() to target the most recently opened dialog so a still-unmounting
    // sheet can't reintroduce a strict-mode match.
    const editSheet = page.getByRole("dialog").last();
    await expect(editSheet).toBeVisible({ timeout: 10000 });

    const pastYear = new Date().getFullYear() - 1;
    await editSheet
      .locator('[data-slot="form-item"]')
      .filter({ hasText: "Service Date" })
      .locator('[data-slot="popover-trigger"]')
      .click();
    await page.locator(".rdp-years_dropdown").selectOption(pastYear.toString());
    await page.locator('[role="gridcell"]:not([data-outside])').first().click();

    await editSheet
      .getByRole("textbox", { name: "Notes *" })
      .fill(updatedNotes);

    await editSheet.getByRole("button", { name: "Update" }).click();

    const updatedCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: updatedNotes })
      .first();

    await updatedCard.scrollIntoViewIfNeeded();
    await expect(updatedCard).toBeVisible();

    await expect(
      page.locator('[data-slot="card"]').filter({ hasText: notes }),
    ).toHaveCount(0);
  });

  test("Show validation error for future date in service record", async ({
    page,
  }) => {
    // Wait for device list to load by checking for at least one device card
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible({ timeout: 10000 });

    await firstDeviceLink.click();

    // Wait for device details page to load by checking for Add Service Record button
    await expect(
      page.getByRole("button", { name: "Add Service Record" }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Add Service Record" }).click();

    const futureYear = new Date().getFullYear() + 1;
    await page
      .locator('[data-slot="form-item"]')
      .filter({ hasText: "Service Date" })
      .locator('[data-slot="popover-trigger"]')
      .click();
    await page
      .locator(".rdp-years_dropdown")
      .selectOption(futureYear.toString());
    await page.locator('[role="gridcell"]:not([data-outside])').first().click();

    await page
      .getByRole("textbox", { name: "Notes *" })
      .fill(faker.lorem.sentence());

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Service date must be set to today or a past date"),
    ).toBeVisible();
  });

  test("Save button should be disabled when no changes are made in edit mode", async ({
    page,
  }) => {
    // Wait for device list to load by checking for at least one device card
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible({ timeout: 10000 });

    await firstDeviceLink.click();

    // Wait for device details page to load by checking for Add Service Record button
    await expect(
      page.getByRole("button", { name: "Add Service Record" }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();

    // Wait for the Add sheet to fully close before opening Edit; otherwise its
    // controls linger in the DOM during the close animation and collide with
    // the edit sheet's controls.
    await expect(page.getByRole("button", { name: "Save" })).toBeHidden();

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: notes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    // With the Add sheet closed, the edit sheet is the only open dialog. Use
    // .last() to target the most recently opened dialog so a still-unmounting
    // sheet can't reintroduce a strict-mode match.
    const editSheet = page.getByRole("dialog").last();
    await expect(editSheet).toBeVisible({ timeout: 10000 });

    const updateButton = editSheet.getByRole("button", { name: "Update" });
    await expect(updateButton).toBeDisabled();

    await editSheet
      .getByRole("textbox", { name: "Notes *" })
      .fill(updatedNotes);

    await expect(updateButton).toBeEnabled();

    await editSheet.getByRole("textbox", { name: "Notes *" }).fill(notes);

    await expect(updateButton).toBeDisabled();
  });
});
