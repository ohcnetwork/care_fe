import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Image Settings", () => {
  // All tests edit the cover of the shared facility. Run them in order in one
  // worker: an upload in a parallel test would make the popup show that image
  // instead of the empty upload area the last test expects.
  test.describe.configure({ mode: "default" });

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    await page.goto(`/facility/${facilityId}/settings/general`);
  });

  test("Upload and Remove facility image", async ({ page }) => {
    const banner = page.locator('[data-cy="facility-cover"]');
    await expect(banner).toBeVisible();
    const originalHeight = await banner.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();
    const cover = page.locator('[data-cy="facility-cover-image"]');
    await expect(cover).toBeVisible();
    await expect
      .poll(() =>
        banner.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBe(originalHeight);
    await expect(cover).toHaveCSS("object-fit", "cover");

    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Cover image deleted")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add cover photo", exact: true }),
    ).toBeVisible();
    await expect(cover).toHaveCount(0);
  });

  test("Replace existing facility image with a new one", async ({ page }) => {
    // Upload first image
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();

    // Replace with second image
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image-2.jpg");

    await page.getByRole("button", { name: "Crop" }).click();
    await page.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(page.getByText("Cover image updated")).toBeVisible();

    // Cleanup
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Cover image deleted")).toBeVisible();
  });

  test("Invalid image selection is cleared when upload popup is closed", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();

    await page
      .locator("input[type='file']")
      .setInputFiles("tests/fixtures/images/test-image.jpg");

    await page.getByRole("button", { name: "Crop" }).click();

    // Close without uploading
    await page.getByRole("button", { name: "Cancel" }).click();

    // Wait for dialog to fully close
    await expect(page.getByRole("dialog")).toBeHidden();

    // Reopen and verify state was reset
    await page
      .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
      .click();
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
