import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Keyboard navigation in search patients", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/patients`);
  });

  test("keyboard navigation: arrow keys highlight, enter commits selection", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();

    const itemCount = await commandItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    await page.keyboard.press("ArrowDown");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");

    const highlightedText = await commandItems.nth(1).innerText();

    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);

    await page.keyboard.press("Control+k");
    const selectedButton = page.getByTestId("selected-option-button");
    await expect(selectedButton).toContainText(highlightedText);
  });

  test("keyboard navigation: ArrowUp moves highlight back and commits selection", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();

    const itemCount = await commandItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    await page.keyboard.press("ArrowDown");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");

    await page.keyboard.press("ArrowUp");
    await expect(commandItems.nth(0)).toHaveAttribute("data-selected", "true");

    const highlightedText = await commandItems.nth(0).innerText();

    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);

    await page.keyboard.press("Control+k");
    const selectedButton = page.getByTestId("selected-option-button");
    await expect(selectedButton).toContainText(highlightedText);
  });
});
