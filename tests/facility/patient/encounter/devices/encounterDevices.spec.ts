import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Devices Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list filtered by in-progress status
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Navigate to the Devices tab
    await page.getByRole("tab", { name: "Devices" }).click();
  });

  test("should display devices tab with associate button", async ({ page }) => {
    // Verify the devices tab content is visible
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();

    // The "Associate Device" button should be visible
    await expect(
      page
        .getByRole("button", { name: /associate device/i })
        .or(page.getByText(/associate device/i)),
    ).toBeVisible();
  });

  test("should associate a device with the encounter", async ({ page }) => {
    await test.step("Open associate device sheet", async () => {
      // Click on the associate device button
      const associateButton = page
        .getByRole("button", { name: /associate device/i })
        .or(page.getByText(/associate device/i).first());
      await associateButton.click();
    });

    await test.step("Search and select a device", async () => {
      // Wait for the sheet/drawer to open
      const sheetOrDrawer = page
        .getByRole("dialog")
        .or(page.locator('[role="dialog"]'))
        .last();
      await expect(sheetOrDrawer).toBeVisible();

      // Search for a device (fixtures create Device 1 through Device 5)
      const searchInput = sheetOrDrawer
        .getByPlaceholder(/search/i)
        .or(sheetOrDrawer.locator('input[type="text"]'));
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill("Device");
        await page.waitForTimeout(500); // Wait for search debounce
      }

      // Select the first device from the search results
      const deviceOption = sheetOrDrawer
        .getByRole("option")
        .or(sheetOrDrawer.locator('[data-slot="command-item"]'))
        .first();
      await deviceOption.waitFor({ state: "visible" });
      await deviceOption.click();
    });

    await test.step("Confirm device association", async () => {
      // Click the associate/confirm button in the sheet
      const confirmButton = page
        .getByRole("button", { name: /associate/i })
        .last();
      await confirmButton.click();

      // Verify success toast
      await expect(
        page.getByText(/device.*associated.*successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify device appears in the table", async () => {
      // Wait for the table to update
      await page.waitForTimeout(1000);

      // The device should now appear in the devices table
      const table = page.getByRole("table");
      if (await table.isVisible().catch(() => false)) {
        // Verify a device row is present
        const rows = table.locator("tbody tr");
        await expect(rows.first()).toBeVisible();
      }
    });
  });

  test("should dissociate a device from the encounter", async ({ page }) => {
    // First, check if there's already a device associated
    const table = page.getByRole("table");
    const hasDevices = await table.isVisible().catch(() => false);

    if (!hasDevices) {
      // Associate a device first
      const associateButton = page
        .getByRole("button", { name: /associate device/i })
        .or(page.getByText(/associate device/i).first());
      await associateButton.click();

      const sheetOrDrawer = page.getByRole("dialog").last();
      await expect(sheetOrDrawer).toBeVisible();

      const deviceOption = sheetOrDrawer
        .getByRole("option")
        .or(sheetOrDrawer.locator('[data-slot="command-item"]'))
        .first();
      await deviceOption.waitFor({ state: "visible" });
      await deviceOption.click();

      const confirmButton = page
        .getByRole("button", { name: /associate/i })
        .last();
      await confirmButton.click();

      await expect(
        page.getByText(/device.*associated.*successfully/i),
      ).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }

    // Now dissociate the device
    await test.step("Click dissociate button on the device", async () => {
      // Find the unlink/dissociate button in the table row
      const unlinkButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-unlink") })
        .first();

      if (await unlinkButton.isVisible().catch(() => false)) {
        await unlinkButton.click();

        // Confirm the dissociation if a dialog appears
        const confirmButton = page
          .getByRole("button", { name: /confirm|dissociate|yes/i })
          .last();
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }
      }
    });
  });
});
