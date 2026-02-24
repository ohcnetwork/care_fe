import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Restart Flow", () => {
  async function navigateToCompletedEncounter(page: Page) {
    const facilityId = getFacilityId();

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?status=completed`,
    );

    const viewLinks = page.getByRole("link", { name: "View Encounter" });

    await expect(viewLinks.first()).toBeVisible({ timeout: 10000 });
    await viewLinks.first().click();

    await page.getByRole("link", { name: "Update Encounter" }).click();
  }

  test("should restart a completed encounter and redirect correctly", async ({
    page,
  }) => {
    await navigateToCompletedEncounter(page);

    // Open settings dropdown
    const settingsButton = page.getByRole("button").filter({
      has: page.locator("svg"),
    });

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
    ).toBeVisible();

    // Verify redirected to updates tab
    await expect(page).toHaveURL(/\/updates$/);

    // Dropdown should no longer contain restart (since not completed anymore)
    await settingsButton.click();
    await expect(
      page.getByRole("menuitem", { name: /restart encounter/i }),
    ).not.toBeVisible();
  });
});
