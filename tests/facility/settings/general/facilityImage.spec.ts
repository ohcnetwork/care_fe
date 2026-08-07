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

    // The image is served by CARE, resolved against the API origin. It is never
    // a storage-provider URL, so switching backend storage changes nothing here.
    const coverImage = page
      .locator('img[src*="/api/v1/assets/facility/"]')
      .first();
    await expect(coverImage).toBeVisible({ timeout: 10000 });
    expect(await coverImage.getAttribute("src")).toContain(
      `${process.env.REACT_CARE_API_URL ?? "http://127.0.0.1:9000"}/api/v1/assets/facility/`,
    );

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

    // Wait for dialog to fully close
    await expect(page.getByRole("dialog")).toBeHidden();

    // Reopen and verify state was reset
    await page.getByRole("button", { name: "Edit Cover Photo" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(dialog.getByText("Drag & drop image to upload")).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.getByText("No image found.")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
