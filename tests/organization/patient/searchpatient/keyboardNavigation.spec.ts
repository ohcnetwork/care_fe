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
    await expect(commandItems).toHaveCount(2, { timeout: 5000 });

    await page.keyboard.press("ArrowDown");
    await expect(commandItems.nth(0)).toHaveAttribute("data-selected", "false");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");

    const highlightedText = (
      await commandItems.nth(1).locator("span").first().innerText()
    ).trim();

    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);

    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("selected-option-button")).toContainText(
      highlightedText,
    );
  });

  test("keyboard navigation: ArrowUp moves highlight back and commits selection", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();
    await expect(commandItems).toHaveCount(2, { timeout: 5000 });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "false");
    await expect(commandItems.nth(0)).toHaveAttribute("data-selected", "true");

    const highlightedText = (
      await commandItems.nth(0).locator("span").first().innerText()
    ).trim();

    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);

    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("selected-option-button")).toContainText(
      highlightedText,
    );
  });

  test("keyboard navigation: Home jumps to first item", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems).toHaveCount(2, { timeout: 5000 });

    await page.keyboard.press("End"); // move to last
    await page.keyboard.press("Home"); // jump to first
    await expect(commandItems.nth(0)).toHaveAttribute("data-selected", "true");
  });

  test("keyboard navigation: End jumps to last item", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems).toHaveCount(2, { timeout: 5000 });

    await page.keyboard.press("End");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");
  });

  test("keyboard navigation: selection does not move past list boundaries", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems).toHaveCount(2, { timeout: 5000 });

    // At first item, ArrowUp should stay on first
    await page.keyboard.press("ArrowUp");
    await expect(commandItems.nth(0)).toHaveAttribute("data-selected", "true");

    // Move to last
    await page.keyboard.press("End");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");

    // ArrowDown should not go past last
    await page.keyboard.press("ArrowDown");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");
  });

  test("no selectable options when filter matches nothing", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();

    const commandInput = page.locator("[cmdk-input]");
    await commandInput.fill("zzzzzz-not-a-patient");

    await expect(commandItems).toHaveCount(0);
  });

  test("keyboard navigation: multiple key presses end with last item selected after End", async ({
    page,
  }) => {
    await page.keyboard.press("Control+k");

    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Home");
    await page.keyboard.press("End");

    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");
  });
});
