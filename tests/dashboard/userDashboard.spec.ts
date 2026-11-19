import { expect, test } from "@playwright/test";

/**
 * User Dashboard E2E Tests
 *
 * Covers the authenticated landing page (`/`) for the admin fixture user
 * (tests/.auth/user.json — a superuser with assigned facilities and a
 * government organization). Asserts the deterministic state this user always
 * renders: greeting + date, the superuser admin-dashboard link, the profile
 * menu, and the Facilities / Governance tablist with switching and navigation.
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with greeting, date, and admin dashboard link", async ({
    page,
  }) => {
    await test.step("Verify greeting and date", async () => {
      await expect(page).toHaveTitle(/CARE/);
      await expect(
        page.getByRole("heading", { name: /^Hey .+$/ }),
      ).toBeVisible();
      await expect(
        page.getByText(
          /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/,
        ),
      ).toBeVisible();
    });

    await test.step("Verify superuser admin dashboard link", async () => {
      const adminLink = page.getByRole("link", { name: /admin dashboard/i });
      await expect(adminLink).toBeVisible();
      await expect(adminLink).toHaveAttribute("href", "/admin/questionnaire");
    });
  });

  test("profile menu exposes edit profile and sign out", async ({ page }) => {
    await test.step("Open the profile dropdown", async () => {
      await page.getByRole("button", { name: /more options/i }).click();
    });

    await test.step("Verify menu items", async () => {
      await expect(
        page.getByRole("menuitem", { name: /edit profile/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /sign out/i }),
      ).toBeVisible();
    });
  });

  test("renders Facilities and Governance tabs with Facilities active", async ({
    page,
  }) => {
    const tablist = page.getByRole("tablist", { name: /dashboard sections/i });

    await test.step("Verify tabs are present", async () => {
      await expect(tablist).toBeVisible();
      await expect(
        tablist.getByRole("tab", { name: /facilities/i }),
      ).toBeVisible();
      await expect(
        tablist.getByRole("tab", { name: /governance/i }),
      ).toBeVisible();
    });

    await test.step("Verify Facilities tab is selected by default", async () => {
      await expect(
        tablist.getByRole("tab", { name: /facilities/i }),
      ).toHaveAttribute("aria-selected", "true");
    });
  });

  test("switching to Governance updates the selected tab and panel", async ({
    page,
  }) => {
    const tablist = page.getByRole("tablist", { name: /dashboard sections/i });
    const facilitiesTab = tablist.getByRole("tab", { name: /facilities/i });
    const governanceTab = tablist.getByRole("tab", { name: /governance/i });

    await test.step("Select the Governance tab", async () => {
      await governanceTab.click();
      await expect(governanceTab).toHaveAttribute("aria-selected", "true");
      await expect(facilitiesTab).toHaveAttribute("aria-selected", "false");
    });

    await test.step("Verify the Governance panel is shown", async () => {
      await expect(page.getByRole("tabpanel")).toBeVisible();
    });

    await test.step("Switch back to Facilities", async () => {
      await facilitiesTab.click();
      await expect(facilitiesTab).toHaveAttribute("aria-selected", "true");
      await expect(governanceTab).toHaveAttribute("aria-selected", "false");
    });
  });

  test("facility cards link to and navigate to facility overview", async ({
    page,
  }) => {
    const panel = page.getByRole("tabpanel");
    const facilityCard = panel.getByRole("link").first();

    await test.step("Verify facility card links to an overview page", async () => {
      await expect(facilityCard).toBeVisible();
      await expect(facilityCard).toHaveAttribute(
        "href",
        /^\/facility\/[^/]+\/overview$/,
      );
    });

    await test.step("Navigate to the facility overview", async () => {
      await facilityCard.click();
      await expect(page).toHaveURL(/\/facility\/[^/]+\/overview$/);
    });
  });

  test("tablist and tabs expose the expected ARIA wiring", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: /dashboard sections/i });
    const facilitiesTab = tablist.getByRole("tab", { name: /facilities/i });

    await test.step("Verify tab ARIA attributes", async () => {
      await expect(facilitiesTab).toHaveAttribute("aria-selected", "true");
      await expect(facilitiesTab).toHaveAttribute("id", /.+/);
      await expect(facilitiesTab).toHaveAttribute("aria-controls", /.+/);
    });

    await test.step("Verify the active panel is a tabpanel", async () => {
      await expect(page.getByRole("tabpanel")).toBeVisible();
    });
  });
});
