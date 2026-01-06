import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

const facilityId = getFacilityId();

test.describe("Keyboard navigation in search patients", () => {
  test("keyboard navigation: arrow keys highlight, enter commits selection", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/patients`);
    await page.keyboard.press("Control+k");
    const commandItems = page.locator("[cmdk-item]");
    await expect(commandItems.first()).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(commandItems.nth(1)).toHaveAttribute("data-selected", "true");
    const highlightedText = await commandItems.nth(1).innerText();
    await page.keyboard.press("Enter");
    await expect(commandItems).toHaveCount(0);
    await page.keyboard.press("Control+k");
    const selectedButton = page.getByTestId("selected-option-button");
    await expect(selectedButton).toContainText(highlightedText);
  });
});
