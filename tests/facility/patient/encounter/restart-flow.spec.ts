import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Restart Flow", () => {
  let encounterId: string | undefined;

  async function navigateToCompletedEncounter(page: Page) {
    const facilityId = getFacilityId();

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?status=completed`,
    );

    const viewLinks = page.getByRole("link", { name: /view encounter/i });

    // Guard: ensure at least one completed encounter exists
    await expect(viewLinks.first()).toBeVisible({ timeout: 10000 });
    await viewLinks.first().click();

    const updateLink = page.getByRole("link", { name: /update encounter/i });

    await expect(updateLink).toBeVisible({ timeout: 10000 });
    await updateLink.click();

    // Extract encounter ID from URL for later reset
    const url = page.url();
    encounterId = url.match(/encounter\/([^/]+)/)?.[1];
  }

  test("should restart a completed encounter and redirect correctly", async ({
    page,
  }) => {
    await navigateToCompletedEncounter(page);

    // Open settings dropdown (more specific selector)
    const settingsButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-settings") })
      .first();

    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Click Restart Encounter option
    const restartOption = page.getByRole("menuitem", {
      name: /restart encounter/i,
    });

    await expect(restartOption).toBeVisible();
    await restartOption.click();

    // Verify success toast
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/encounter restarted successfully/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify redirected to updates tab (no strict end anchor)
    await expect(page).toHaveURL(/\/updates/);

    const statusDropdown = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    // Verify encounter status is no longer completed
    await expect(statusDropdown).not.toHaveText(/completed/i);

    // Verify encounter is editable again
    await expect(statusDropdown).toBeEnabled();

    // Re-open dropdown safely
    await settingsButton.click();

    // Ensure dropdown opened before negative assertion
    await expect(page.getByRole("menuitem").first()).toBeVisible();

    // Restart should no longer appear
    await expect(
      page.getByRole("menuitem", { name: /restart encounter/i }),
    ).not.toBeVisible();
  });

  test("should not show update encounter link for non-completed encounters", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?status=in_progress`,
    );

    const viewLinks = page.getByRole("link", { name: /view encounter/i });

    await expect(viewLinks.first()).toBeVisible({ timeout: 10000 });
    await viewLinks.first().click();

    // Ensure update encounter link does not exist
    await expect(
      page.getByRole("link", { name: /update encounter/i }),
    ).toHaveCount(0);
  });

  test.afterEach(async ({ request }) => {
    // Reset encounter back to completed for isolation
    if (encounterId) {
      await request.patch(`/api/v1/encounter/${encounterId}/`, {
        data: { status: "completed" },
      });
    }
  });
});
