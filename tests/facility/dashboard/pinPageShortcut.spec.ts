import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Pin Page Shortcut (Shift+B)", () => {
  let facilityId: string;
  let pageUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    pageUrl = `/facility/${facilityId}/users`;
    await page.goto(pageUrl);
    await expect(
      page.getByRole("button", { name: "Pin/Add to Overview" }),
    ).toBeAttached();
  });

  test("should pin and unpin a page to the facility overview", async ({
    page,
  }) => {
    const title = `Pinned ${faker.string.alphanumeric(8)}`;

    await test.step("Pin the current page using Shift+B", async () => {
      await page.keyboard.press("Shift+B");

      const dialog = page.getByRole("dialog", { name: "Pin/Add to Overview" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(pageUrl)).toBeVisible();

      await dialog.getByRole("textbox", { name: "Title" }).fill(title);

      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
        ),
        dialog.getByRole("button", { name: "Bookmark Page" }).click(),
      ]);
      await expect(dialog).toBeHidden();
    });

    await test.step("Verify pinned link appears on overview", async () => {
      await page.goto(`/facility/${facilityId}/overview`);

      await expect(
        page.getByRole("heading", { name: "Pinned Links" }),
      ).toBeVisible();
      const pinnedLink = page.getByRole("link", { name: title });
      await expect(pinnedLink).toBeVisible();
      await expect(pinnedLink).toHaveAttribute("href", pageUrl);

      await pinnedLink.click();
      await expect(page).toHaveURL(pageUrl);
    });

    await test.step("Unpin the page using Shift+B", async () => {
      await expect(
        page.getByRole("button", { name: "Unpin/Remove from Overview" }),
      ).toBeAttached();
      await page.keyboard.press("Shift+B");

      const dialog = page.getByRole("dialog", {
        name: "Unpin/Remove from Overview",
      });
      await expect(dialog).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/v1/users/set_preferences/") && res.ok(),
        ),
        dialog.getByRole("button", { name: "Unbookmark Page" }).click(),
      ]);
      await expect(dialog).toBeHidden();
    });

    await test.step("Verify pinned link is removed from overview", async () => {
      await page.goto(`/facility/${facilityId}/overview`);

      await expect(
        page.getByRole("heading", { name: "Quick Actions" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    });
  });
});
