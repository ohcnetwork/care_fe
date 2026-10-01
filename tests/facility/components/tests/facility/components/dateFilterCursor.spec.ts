import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Date filter cursor", () => {
  test("shows a pointer across the clickable trigger and opens from its padding", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(
      `/facility/${facilityId}/appointments?date_from=2026-09-01&date_to=2026-09-07`,
    );

    const trigger = page
      .locator('[data-slot="dropdown-menu-trigger"]')
      .filter({ hasText: /^Date$/ });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveCSS("cursor", "pointer");
    await expect(trigger.locator("span")).toHaveCSS("cursor", "pointer");
    await expect(trigger.locator("svg")).toHaveCSS("cursor", "pointer");

    const bounds = await trigger.boundingBox();
    if (!bounds) throw new Error("Date filter trigger has no bounds");

    for (const x of [2, bounds.width - 2]) {
      const point = { x: bounds.x + x, y: bounds.y + bounds.height / 2 };
      await page.mouse.move(point.x, point.y);
      const cursor = await page.evaluate(({ x, y }) => {
        const element = document.elementFromPoint(x, y);
        return element ? getComputedStyle(element).cursor : null;
      }, point);
      expect(cursor).toBe("pointer");
    }

    await trigger.click({ position: { x: 2, y: bounds.height / 2 } });
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).not.toBeVisible();
  });
});
