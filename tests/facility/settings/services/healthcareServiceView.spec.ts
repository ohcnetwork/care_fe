import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service View", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
  });

  test("should display healthcare services list page", async ({ page }) => {
    // Verify the healthcare services list page loads
    await expect(
      page.getByRole("button", { name: /add healthcare service/i }),
    ).toBeVisible();

    // Verify search input exists
    await expect(
      page.getByRole("textbox", { name: /search healthcare services/i }),
    ).toBeVisible();
  });

  test("should search for an existing healthcare service", async ({ page }) => {
    // Fixtures create "Pathology Lab" and "Main Pharmacy" healthcare services
    await page
      .getByRole("textbox", { name: /search healthcare services/i })
      .fill("Pathology");

    // Should find the Pathology Lab service (the assertion auto-waits for the
    // debounced search results).
    const serviceLink = page.getByRole("link", { name: /pathology lab/i });
    await expect(serviceLink).toBeVisible({ timeout: 10000 });
  });

  test("should view healthcare service details", async ({ page }) => {
    // Search for the fixture-created service
    await page
      .getByRole("textbox", { name: /search healthcare services/i })
      .fill("Pathology");

    // Click on the service to view details (auto-waits for the search result).
    await page.getByRole("link", { name: /pathology lab/i }).click();

    // Wait for the detail page to load
    await page.waitForURL(/\/healthcare_services\/[^/]+$/);

    // Verify service name is displayed
    await expect(page.getByText(/pathology lab/i).first()).toBeVisible();

    // Verify action buttons are present (Edit, Delete)
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("should view pharmacy healthcare service", async ({ page }) => {
    // Search for the Main Pharmacy service created by fixtures
    await page
      .getByRole("textbox", { name: /search healthcare services/i })
      .fill("Pharmacy");

    // Click on the service (the assertion below auto-waits for the result).
    const pharmacyLink = page.getByRole("link", { name: /main pharmacy/i });
    await expect(pharmacyLink).toBeVisible({ timeout: 10000 });
    await pharmacyLink.click();

    // Verify pharmacy service details
    await page.waitForURL(/\/healthcare_services\/[^/]+$/);
    await expect(page.getByText(/main pharmacy/i).first()).toBeVisible();
  });
});
