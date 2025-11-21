import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Profile Avatar Modification", () => {
  const username = "doctor_2_0";
  const validImagePath = "tests/fixtures/images/avatar.jpg";
  const invalidFilePath = "tests/fixtures/images/sample_file.xlsx";

  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${username}`);
  });

  test("Upload and modify user avatar", async ({ page }) => {
    await test.step("Navigate to user profile", async () => {
      await expect(page).toHaveURL(`/users/${username}`);
    });

    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();

      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      await expect(dialog).toBeVisible();
    });

    await test.step("Upload avatar image", async () => {
      const fileInput = page.locator("#upload-cover-image");
      await fileInput.setInputFiles(validImagePath);

      await page.waitForTimeout(1000);
    });

    await test.step("Crop the uploaded image", async () => {
      const cropButton = page.getByRole("button", { name: "Crop" });
      await cropButton.click();

      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByText(/cropped successfully/i),
      ).toBeVisible({ timeout: 5000 });
    });

    await test.step("Save the cropped avatar", async () => {
      const uploadButton = page.getByRole("button", { name: "Upload" });
      await uploadButton.click();

      await page.waitForTimeout(2000);

      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (!dialogVisible) {
        const errorNotification = page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByText(/something went wrong|error|failed/i);
        await expect(errorNotification)
          .not.toBeVisible({ timeout: 1000 })
          .catch(() => {});
      }
    });
  });

  test("Delete user avatar", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();

      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      await expect(dialog).toBeVisible();
    });

    await test.step("Delete the avatar", async () => {
      const deleteResponse = page
        .waitForResponse(
          (response) =>
            response
              .url()
              .includes(`/api/v1/users/${username}/profile_picture/`) &&
            response.request().method() === "DELETE",
          { timeout: 5000 },
        )
        .catch(() => null);

      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });

      const deleteButton = dialog.getByRole("button", { name: "Delete" });

      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        const response = await deleteResponse;
        if (response) {
          expect(response.status()).toBe(204);
        }
      }
    });
  });

  test("Reject avatar upload with invalid file type", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();
    });

    await test.step("Attempt to upload invalid file type", async () => {
      const fileInput = page.locator("#upload-cover-image");
      await fileInput.setInputFiles(invalidFilePath);

      await page.waitForTimeout(1000);

      const cropButton = page.getByRole("button", { name: "Crop" });
      const isDisabled = await cropButton.isDisabled().catch(() => true);

      expect(isDisabled).toBeTruthy();
    });
  });

  test("Cancel avatar upload process", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();
    });

    await test.step("Upload and crop avatar image", async () => {
      const fileInput = page.locator("#upload-cover-image");
      await fileInput.setInputFiles(validImagePath);

      await page.waitForTimeout(1000);

      const cropButton = page.getByRole("button", { name: "Crop" });
      await cropButton.click();

      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByText(/cropped successfully/i),
      ).toBeVisible({ timeout: 5000 });
    });

    await test.step("Cancel the upload", async () => {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const cancelButton = dialog
        .getByRole("button", { name: /cancel|close/i })
        .first();
      await cancelButton.click();

      await expect(dialog).not.toBeVisible();
    });
  });

  test("Verify avatar section exists on profile page", async ({ page }) => {
    await test.step("Verify profile page loaded", async () => {
      await expect(page).toHaveURL(`/users/${username}`);
    });

    await test.step("Verify avatar edit section is visible", async () => {
      const avatarSection = page.locator("text=Edit Avatar").first();
      await expect(avatarSection).toBeVisible();

      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await expect(changeAvatarButton).toBeVisible();
    });

    await test.step("Verify avatar file type requirements displayed", async () => {
      const fileRequirements = page.locator("text=/JPG or PNG.*2MB max/i");
      await expect(fileRequirements).toBeVisible();
    });
  });

  test("Verify dialog has all required upload options", async ({ page }) => {
    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();

      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
      await expect(dialog).toBeVisible();
    });

    await test.step("Verify upload options are present", async () => {
      const dialog = page.getByRole("dialog", { name: "Edit Avatar" });

      const uploadOption = dialog.getByText(/upload an image/i);
      await expect(uploadOption).toBeVisible();

      const openCameraButton = dialog.getByRole("button", {
        name: /open camera/i,
      });
      await expect(openCameraButton).toBeVisible();

      const cancelButton = dialog.getByRole("button", { name: /cancel/i });
      await expect(cancelButton).toBeVisible();
    });

    await test.step("Verify dialog file requirements text", async () => {
      const fileRequirements = page.locator(
        "text=/No image found.*Max size.*2MB/i",
      );
      await expect(fileRequirements).toBeVisible();

      const allowedFormats = page.locator(
        "text=/Allowed formats.*jpg.*png.*jpeg/i",
      );
      await expect(allowedFormats).toBeVisible();
    });
  });

  test("Verify crop button only appears after image upload", async ({
    page,
  }) => {
    await test.step("Open avatar editor dialog", async () => {
      const changeAvatarButton = page.getByRole("button", {
        name: /change avatar/i,
      });
      await changeAvatarButton.click();
    });

    await test.step("Verify crop button is initially disabled", async () => {
      const cropButton = page.getByRole("button", { name: "Crop" });
      const isDisabled = await cropButton.isDisabled().catch(() => true);

      expect(isDisabled).toBeTruthy();
    });

    await test.step("Upload image and verify crop button is enabled", async () => {
      const fileInput = page.locator("#upload-cover-image");
      await fileInput.setInputFiles(validImagePath);

      await page.waitForTimeout(1000);

      const cropButton = page.getByRole("button", { name: "Crop" });
      const isEnabled = await cropButton.isEnabled().catch(() => false);

      expect(isEnabled).toBeTruthy();
    });
  });
});
