import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Departments Tab", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  /**
   * Helper: navigate to the Departments tab for the first user in the facility.
   */
  async function navigateToDepartmentsTab(
    page: import("@playwright/test").Page,
  ) {
    await page.goto(`/facility/${facilityId}/users`);
    const seeDetailsButton = page
      .getByRole("button", { name: "See Details" })
      .first();
    await expect(seeDetailsButton).toBeVisible();
    await seeDetailsButton.click();
    await page.getByRole("tab", { name: "Departments" }).click();
    await page.waitForLoadState("networkidle");
  }

  test("search input is visible and filters departments by name", async ({
    page,
  }) => {
    await navigateToDepartmentsTab(page);

    await test.step("Search input is present", async () => {
      await expect(page.getByPlaceholder("Search departments")).toBeVisible();
    });

    // Positive search: if departments exist, search for the first one's name
    await test.step("Searching for an existing department name shows that card", async () => {
      const firstCard = page.locator('[data-slot="card"]').first();
      const hasCards = await firstCard.isVisible().catch(() => false);

      if (hasCards) {
        const departmentName = await firstCard
          .getByRole("heading")
          .first()
          .textContent();
        if (departmentName) {
          const searchInput = page.getByPlaceholder("Search departments");
          await searchInput.fill(departmentName.trim());
          await page.waitForLoadState("networkidle");
          // The matching card should still be visible
          await expect(
            page.getByRole("heading", {
              name: departmentName.trim(),
              exact: true,
            }),
          ).toBeVisible();
        }
      }
    });

    // Negative search: a term that matches nothing
    await test.step("Searching for a non-existent term shows no-results state", async () => {
      const searchInput = page.getByPlaceholder("Search departments");
      await searchInput.fill("zzz_no_match_xyz_99999");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("No Departments Found")).toBeVisible();
    });

    await test.step("Clearing search restores the list", async () => {
      const searchInput = page.getByPlaceholder("Search departments");
      await searchInput.clear();
      await page.waitForLoadState("networkidle");
      // Either cards appear or the empty-assigned state shows — either is correct
      const restored =
        (await page
          .locator('[data-slot="card"]')
          .first()
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText("No Departments Assigned")
          .isVisible()
          .catch(() => false));
      expect(restored).toBe(true);
    });
  });

  test("pagination control absent when results fit on one page", async ({
    page,
  }) => {
    await navigateToDepartmentsTab(page);
    await page.waitForLoadState("networkidle");

    const cardCount = await page.locator('[data-slot="card"]').count();

    if (cardCount < 12) {
      // Under the page limit: pagination nav should not be rendered
      await expect(
        page.getByRole("navigation", { name: /pagination/i }),
      ).not.toBeVisible();
    } else {
      // At or over the limit: pagination nav should be present
      await expect(
        page.getByRole("navigation", { name: /pagination/i }),
      ).toBeVisible();
    }
  });

  test("edit-role sheet pre-populates the current role", async ({ page }) => {
    await navigateToDepartmentsTab(page);

    // Find department cards that have an edit trigger (a pen/ghost button)
    const penTriggers = page.locator(
      '[data-slot="card"] button[class*="ghost"]',
    );
    const triggerCount = await penTriggers.count();

    if (triggerCount === 0) {
      test.skip(
        true,
        "No department assignments in fixture — skipping role pre-population test",
      );
      return;
    }

    await test.step("Read the current role name from the department card badge", async () => {
      // The role badge sits inside the card footer, labelled by "role:"
      // We grab the first card's role badge text for comparison
      const firstCard = page.locator('[data-slot="card"]').first();
      const roleBadge = firstCard.locator('[data-slot="badge"]').last(); // last badge = role (after type + optional has_children badges)
      await expect(roleBadge).toBeVisible();
    });

    await test.step("Open edit-role sheet and verify current role is pre-selected", async () => {
      const firstCard = page.locator('[data-slot="card"]').first();
      const roleName = await firstCard
        .locator('[data-slot="badge"]')
        .last()
        .textContent();

      // Open the sheet via the pen edit button
      await penTriggers.first().click();
      await expect(
        page.getByRole("heading", { name: "Edit User Role" }),
      ).toBeVisible();

      // The RoleSelect trigger should display the current role name,
      // not the "Select role" placeholder
      if (roleName) {
        await expect(
          page.getByRole("combobox").filter({ hasText: roleName.trim() }),
        ).toBeVisible();
      }

      // Update Role button must be disabled until a DIFFERENT role is chosen
      await expect(
        page.getByRole("button", { name: "Update Role" }),
      ).toBeDisabled();

      await page.keyboard.press("Escape");
    });
  });
});
