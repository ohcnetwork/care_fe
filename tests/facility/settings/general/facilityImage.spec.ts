import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Image Settings", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/settings/general`);
  });

  test("Upload and Remove facility image", async ({ page }) => {
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload" }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();

    await page.getByRole("button", { name: "Edit Cover Photo" }).click();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Cover image deleted")).toBeVisible();
  });

  test("Replace existing facility image with a new one", async ({ page }) => {
    // Upload first image
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload" }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();

    // Replace with second image
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image-2.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload" }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();

    // Cleanup
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Cover image deleted")).toBeVisible();
  });

  test("Invalid image selection is cleared when upload popup is closed", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();

    // Close without uploading
    await page.getByRole("button", { name: "Cancel" }).click();

    // Reopen and verify state was reset
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();

    await expect(page.getByText("Drag & drop image to upload")).toBeVisible();
    await expect(page.getByText("No image found.")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
