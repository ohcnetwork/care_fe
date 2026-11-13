import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The facility sidebar renders its own Encounters/Services links with the same
// names, so scope quick-action assertions to the Quick Actions section (the
// heading's parent) to avoid matching the sidebar nav.
function quickActions(page: Page) {
  return page.getByRole("heading", { name: "Quick Actions" }).locator("..");
}

test.describe("Facility Overview Page", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/overview`);
  });

  test("should display the overview page with quick actions", async ({
    page,
  }) => {
    await expect(page.getByText("Welcome back to the overview")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Quick Actions" }),
    ).toBeVisible();
  });

  test("should show quick action links for key sections", async ({ page }) => {
    await expect(
      quickActions(page).getByRole("link", { name: /encounters/i }),
    ).toBeVisible();
    await expect(
      quickActions(page).getByRole("link", { name: /services/i }),
    ).toBeVisible();
  });

  test("should navigate to encounters from quick actions", async ({ page }) => {
    await quickActions(page)
      .getByRole("link", { name: /encounters/i })
      .click();

    await page.waitForURL(/\/encounters/);
    await expect(page).toHaveURL(/\/encounters/);
  });

  test("should navigate to services from quick actions", async ({ page }) => {
    await quickActions(page)
      .getByRole("link", { name: /services/i })
      .click();

    await page.waitForURL(/\/services/);
    await expect(page).toHaveURL(/\/services/);
  });
});
