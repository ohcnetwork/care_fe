import { expect, test } from "@playwright/test";

test.describe("Keyboard navigation in search patients", () => {
  test("keyboard navigation: arrow keys highlight, enter commits selection", async ({
    page,
  }) => {
    await page.goto("/facility/:facilityId/patients");
    await page.keyboard.press("Control+k");
    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const highlightedText = await commandItems.nth(1).innerText();
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");
    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);
    await page.keyboard.press("Control+K");
    const selectedButton = page.locator("button:has(svg)");
    await expect(selectedButton).toContainText(highlightedText);
  });
});
