import { expect, test, type Locator } from "@playwright/test";
import {
  createDisposableUserViaApi,
  deleteAvatarViaUi,
  openAvatarDialog,
  uploadAndCropAvatarImage,
  uploadAvatarViaUi,
} from "tests/helper/auth";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Profile Avatar Modification", () => {
  const validImagePath = "tests/fixtures/images/avatar.jpg";
  const secondImagePath = "tests/fixtures/images/test-image.jpg";
  const invalidFilePath = "tests/fixtures/images/sample_file.xlsx";
  let username: string;

  // Every test edits the avatar of its own throwaway user (the admin can edit
  // any user's avatar), so parallel uploads and deletes never race, and the
  // "No image found" state is never another test's leftover.
  test.beforeEach(async ({ page }) => {
    ({ username } = await createDisposableUserViaApi());
    await page.goto(`/users/${username}`);
  });

  test(
    "Verify dialog has all required upload options",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
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
    },
  );

  test(
    "Upload a new avatar image",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
      // Opens the editor, uploads and crops the image, and saves it.
      await uploadAvatarViaUi(page, { username, imagePath: validImagePath });
    },
  );

  test(
    "Upload a new avatar image and delete it",
    { tag: ["@atomic", "@cap:profile.avatar.delete"] },
    async ({ page }) => {
      await test.step("Upload and save avatar", async () => {
        await uploadAvatarViaUi(page, { username, imagePath: validImagePath });
      });

      await test.step("Open the editor again and delete the uploaded avatar", async () => {
        // Expects a 204 from the delete and the editor to close.
        await deleteAvatarViaUi(page, { username });
      });
    },
  );

  test(
    "Upload a new avatar image and replace it with another image",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
      await test.step("Upload first avatar image", async () => {
        await uploadAvatarViaUi(page, { username, imagePath: validImagePath });
      });

      await test.step("Replace with second avatar image", async () => {
        await uploadAvatarViaUi(page, { username, imagePath: secondImagePath });
      });
    },
  );

  test(
    "Show a real image source in the cropper and cropped preview",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
      let dialog: Locator;

      await test.step("Upload an image and verify the cropper uses a real source", async () => {
        dialog = await openAvatarDialog(page);
        await page
          .locator("input[type='file']")
          .first()
          .setInputFiles(validImagePath);
        await expect(page.getByRole("button", { name: "Crop" })).toBeEnabled({
          timeout: 10000,
        });
        await expect(dialog.locator(".reactEasyCrop_Image")).toHaveAttribute(
          "src",
          /^(blob:|data:)/,
        );
      });

      await test.step("Crop and verify the cropped preview", async () => {
        await page.getByRole("button", { name: "Crop" }).click();
        const croppedPreview = dialog.getByAltText("Cropped preview");
        await expect(croppedPreview).toBeVisible({ timeout: 10000 });
        await expect(croppedPreview).toHaveAttribute("src", /^(blob:|data:)/);
      });
    },
  );

  test(
    "Reject avatar upload with invalid file type",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
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
    },
  );

  test(
    "Cancel avatar upload process",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
      await test.step("Open avatar editor dialog", async () => {
        await openAvatarDialog(page);
      });

      await test.step("Upload and crop avatar image", async () => {
        await uploadAndCropAvatarImage(page, validImagePath);
      });

      await test.step("Cancel the upload", async () => {
        const dialog = page.getByRole("dialog", { name: "Edit Avatar" });
        await expect(dialog).toBeVisible();

        await dialog.getByRole("button", { name: /cancel/i }).click();
        await expect(dialog).toBeHidden();
      });
    },
  );

  test(
    "opens the avatar editor with the keyboard and returns focus after closing",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
      const trigger = page.getByRole("button", {
        name: "Change Avatar",
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: "Edit Avatar",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    },
  );

  test(
    "Verify crop button only appears after image upload",
    { tag: ["@atomic", "@cap:profile.avatar.upload"] },
    async ({ page }) => {
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
    },
  );
});
