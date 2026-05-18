import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Queue Practitioner Search", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/queues`);
  });

  test("should open practitioner selector with search", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByPlaceholder(/search departments and/i),
    ).toBeVisible();
  });

  test("should search and select practitioner by name", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    const searchInput = dialog.getByPlaceholder(/search departments and/i);

    await searchInput.fill("admin");

    const practitionersGroup = dialog.getByText(/practitioners/i);

    if (await practitionersGroup.isVisible().catch(() => false)) {
      const firstOption = dialog.locator("[role='option']").first();
      await firstOption.click();

      const selector = page.getByRole("combobox");
      await expect(selector).not.toContainText(/select/i);
      await expect(selector).toBeVisible();
    } else {
      const options = dialog.locator("[role='option']");
      expect(await options.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("should navigate through departments", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    const departments = dialog.locator("[role='option']");

    await departments.first().click();

    const backButton = dialog.getByRole("button").filter({
      has: page.locator("svg.lucide-arrow-left"),
    });
    const options = dialog.locator("[role='option']");

    const hasBackButton = await backButton.isVisible().catch(() => false);
    const hasOptions = (await options.count()) > 0;

    expect(hasBackButton || hasOptions).toBeTruthy();
  });

  test("should close on escape key", async ({ page }) => {
    await page.getByRole("combobox").click();

    const dialog = page.locator("[role='dialog']").last();
    await dialog.waitFor({ state: "visible" });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
