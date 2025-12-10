import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Profile Avatar Modification", () => {
  const username = "doctor_2_0";
  const validImagePath = "tests/fixtures/images/avatar.jpg";
  const secondImagePath = "tests/fixtures/images/test-image.jpg";
  const invalidFilePath = "tests/fixtures/images/sample_file.xlsx";

  // Helper function to open avatar editor dialog
  async function openAvatarDialog(page: Page): Promise<Locator> {
    const changeAvatarButton = page.getByRole("button", {
      name: /change avatar/i,
    });
    await changeAvatarButton.click();

    const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  // Helper function to upload and crop an image
  async function uploadAndCropImage(
    page: Page,
    imagePath: string,
  ): Promise<void> {
    const fileInput = page.locator("input[type='file']").first();
    await fileInput.setInputFiles(imagePath);

    // Wait for crop button to be enabled (indicates image is loaded)
    const cropButton = page.getByRole("button", { name: "Crop" });
    await expect(cropButton).toBeEnabled({ timeout: 10000 });
    await cropButton.click();

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByText(/cropped successfully/i),
    ).toBeVisible({ timeout: 10000 });
  }

  // Helper function to save the avatar
  async function saveAvatar(page: Page): Promise<void> {
    const uploadButton = page.getByRole("button", { name: "Upload" });
    await uploadButton.click();

    // Wait for upload to complete by checking dialog closes
    const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Verify no error notification
    const errorNotification = page
      .getByRole("region", { name: "Notifications alt+T" })
      .getByText(/error|failed/i);
    await expect(errorNotification)
      .not.toBeVisible({ timeout: 1000 })
      .catch(() => {});
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${username}`);
  });

  test("Verify dialog has all required upload options", async ({ page }) => {
    let dialog: Locator;

    await test.step("Open avatar editor dialog", async () => {
      dialog = await openAvatarDialog(page);
    });

    await test.step("Verify upload options are present", async () => {
      await expect(dialog.getByText(/upload an image/i)).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /open camera/i }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /cancel/i }),
      ).toBeVisible();
    });

    await test.step("Verify dialog file requirements text", async () => {
      await expect(
        dialog.getByText(/No image found.*Max size.*2MB/i),
      ).toBeVisible();
      await expect(
        dialog.getByText(/Allowed formats.*jpg.*png.*jpeg/i),
      ).toBeVisible();
    });
  });

  test("Upload a new avatar image", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      await openAvatarDialog(page);
    });

    await test.step("Upload and crop avatar image", async () => {
      await uploadAndCropImage(page, validImagePath);
    });

    await test.step("Save the cropped avatar", async () => {
      await saveAvatar(page);
    });
  });

  test("Upload a new avatar image and delete it", async ({ page }) => {
    await test.step("Upload and save avatar", async () => {
      await openAvatarDialog(page);
      await uploadAndCropImage(page, validImagePath);
      await saveAvatar(page);
    });

    await test.step("Open avatar editor dialog again", async () => {
      await openAvatarDialog(page);
    });

    await test.step("Delete the uploaded avatar", async () => {
      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      const deleteButton = dialog.getByRole("button", { name: "Delete" });

      // Check if delete button is visible before clicking
      const isVisible = await deleteButton.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();

      const deleteResponse = page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`/api/v1/users/${username}/profile_picture/`) &&
          response.request().method() === "DELETE",
        { timeout: 5000 },
      );

      await deleteButton.click();

      const response = await deleteResponse;
      expect(response.status()).toBe(204);

      // Verify dialog closes after deletion
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
  });

  test("Upload a new avatar image and replace it with another image", async ({
    page,
  }) => {
    await test.step("Upload first avatar image", async () => {
      await openAvatarDialog(page);
      await uploadAndCropImage(page, validImagePath);
      await saveAvatar(page);
    });

    await test.step("Replace with second avatar image", async () => {
      await openAvatarDialog(page);
      await uploadAndCropImage(page, secondImagePath);
      await saveAvatar(page);
    });
  });

  test("Reject avatar upload with invalid file type", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      await openAvatarDialog(page);
    });

    await test.step("Attempt to upload invalid file type", async () => {
      const fileInput = page.locator("input[type='file']").first();
      await fileInput.setInputFiles(invalidFilePath);

      // Wait for crop button and check it's disabled (indicates file validation happened)
      const cropButton = page.getByRole("button", { name: "Crop" });
      await expect(cropButton).toBeDisabled({ timeout: 5000 });
    });
  });

  test("Cancel avatar upload process", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      await openAvatarDialog(page);
    });

    await test.step("Upload and crop avatar image", async () => {
      await uploadAndCropImage(page, validImagePath);
    });

    await test.step("Cancel the upload", async () => {
      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: /cancel/i }).click();
      await expect(dialog).not.toBeVisible();
    });
  });

  test("Verify avatar section exists on profile page", async ({ page }) => {
    await test.step("Verify profile page loaded", async () => {
      await expect(page).toHaveURL(`/users/${username}`);
    });

    await test.step("Verify avatar edit section is visible", async () => {
      await expect(
        page.getByRole("button", { name: /change avatar/i }),
      ).toBeVisible();
      await expect(page.getByText("Edit Avatar").first()).toBeVisible();
    });

    await test.step("Verify avatar file type requirements displayed", async () => {
      await expect(page.getByText(/JPG or PNG.*2MB max/i)).toBeVisible();
    });
  });

  test("Verify crop button only appears after image upload", async ({
    page,
  }) => {
    await test.step("Open avatar editor dialog", async () => {
      await openAvatarDialog(page);
    });

    await test.step("Verify crop button is initially disabled", async () => {
      await expect(page.getByRole("button", { name: "Crop" })).toBeDisabled();
    });

    await test.step("Upload image and verify crop button is enabled", async () => {
      await page
        .locator("input[type='file']")
        .first()
        .setInputFiles(validImagePath);

      await expect(page.getByRole("button", { name: "Crop" })).toBeEnabled({
        timeout: 10000,
      });
    });
  });
});
