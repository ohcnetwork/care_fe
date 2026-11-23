import { expect, test } from "@playwright/test";
import {
  createFacilityViaApi,
  deleteFacilityCoverViaUi,
  uploadFacilityCoverViaUi,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Image Settings", () => {
  // Each test edits the cover of a facility of its own, so an upload in one
  // test can't show up in another, and the shared facility keeps its cover.
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    ({ facilityId } = await createFacilityViaApi({
      templateFacilityId: getFacilityId(),
    }));

    await page.goto(`/facility/${facilityId}/settings/general`);
  });

  test(
    "Upload and Remove facility image",
    { tag: ["@atomic", "@cap:facility.settings.cover.upload"] },
    async ({ page }) => {
      const banner = page.locator('[data-cy="facility-cover"]');
      await expect(banner).toBeVisible();
      const originalHeight = await banner.evaluate(
        (element) => element.getBoundingClientRect().height,
      );
      await uploadFacilityCoverViaUi(page, {
        facilityId,
        filePath: "tests/fixtures/images/test-image.jpg",
      });

      const cover = page.locator('[data-cy="facility-cover-image"]');
      await expect(cover).toBeVisible();
      await expect
        .poll(() =>
          banner.evaluate((element) => element.getBoundingClientRect().height),
        )
        .toBe(originalHeight);
      await expect(cover).toHaveCSS("object-fit", "cover");

      await deleteFacilityCoverViaUi(page, { facilityId });

      await expect(
        page.getByRole("button", { name: "Add cover photo", exact: true }),
      ).toBeVisible();
      await expect(cover).toHaveCount(0);
    },
  );

  test(
    "Replace existing facility image with a new one",
    { tag: ["@atomic", "@cap:facility.settings.cover.upload"] },
    async ({ page }) => {
      // Upload first image
      await uploadFacilityCoverViaUi(page, {
        facilityId,
        filePath: "tests/fixtures/images/test-image.jpg",
      });

      // Replace with second image
      await uploadFacilityCoverViaUi(page, {
        facilityId,
        filePath: "tests/fixtures/images/test-image-2.jpg",
      });

      // Cleanup
      await deleteFacilityCoverViaUi(page, { facilityId });
    },
  );

  test(
    "Invalid image selection is cleared when upload popup is closed",
    { tag: ["@atomic", "@cap:facility.settings.cover.upload"] },
    async ({ page }) => {
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

      await expect(dialog.getByText("Drag & drop image to upload")).toBeVisible(
        {
          timeout: 15_000,
        },
      );
      await expect(dialog.getByText("No image found.")).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: "Cancel" }).click();
    },
  );
});
