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
    await page.waitForLoadState("networkidle");

    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();
  });

  test("Edit an existing service record and verify changes", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: notes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    const pastYear = new Date().getFullYear() - 1;
    await page
      .locator('[data-slot="form-item"]')
      .filter({ hasText: "Service Date" })
      .locator('[data-slot="popover-trigger"]')
      .click();
    await page.locator(".rdp-years_dropdown").selectOption(pastYear.toString());
    await page.locator('[role="gridcell"]:not([data-outside])').first().click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(updatedNotes);

    await page.getByRole("button", { name: "Update" }).click();

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
    await page.waitForLoadState("networkidle");

    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

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
    await page.waitForLoadState("networkidle");

    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Add Service Record" }).click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(notes)).toBeVisible();

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: notes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    const updateButton = page.getByRole("button", { name: "Update" });
    await expect(updateButton).toBeDisabled();

    await page.getByRole("textbox", { name: "Notes *" }).fill(updatedNotes);

    await expect(updateButton).toBeEnabled();

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

    await expect(updateButton).toBeDisabled();
  });
});
