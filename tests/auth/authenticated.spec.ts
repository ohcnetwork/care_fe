import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Authenticated User Flow", () => {
  test("should access dashboard when logged in", async ({ page }) => {
    // Navigate to a protected page
    await page.goto("/");

    // Verify user is logged in
    // Adjust these selectors based on your actual application
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible();
  });

  test("should be able to navigate to facilities", async ({ page }) => {
    const facilityPath = `/facility/${getFacilityId()}/overview`;
    await page.goto("/");
    await page
      .getByRole("tabpanel")
      .getByRole("link", { name: /facility with patients?/i })
      .click();
    await expect(page).toHaveURL(facilityPath);
    await expect(
      page.getByRole("link", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });
});
