import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Location List & Hierarchy", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test("should display the locations list with fixture locations", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Add Location" }),
    ).toBeVisible();

    // Fixtures create Ward A, Bio-Chemistry Lab, and Pharmacy as top-level rows.
    await expect(page.getByRole("cell", { name: "Ward A" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Bio-Chemistry Lab" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Pharmacy" })).toBeVisible();
  });

  test("should search locations by name", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill("Pharmacy");

    await expect(page.getByRole("cell", { name: "Pharmacy" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ward A" })).toBeHidden();
  });

  test("should offer editing a location", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Edit Location" }).first(),
    ).toBeVisible();
  });
});
