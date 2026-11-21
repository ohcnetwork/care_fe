import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Security - password update form", () => {
  test("reveals the form from the Update Password button and cancels back", async ({
    page,
  }) => {
    await page.goto("/users/admin/security");

    const updateButton = page.locator("#change-edit-password-button");
    const currentPassword = page.getByLabel("Current Password");

    await test.step("The form is collapsed behind the button", async () => {
      await expect(updateButton).toBeVisible();
      await expect(updateButton).toHaveText(/Update Password/);
      await expect(currentPassword).toHaveCount(0);
    });

    await test.step("Clicking the button swaps it for the form", async () => {
      await updateButton.click();
      await expect(currentPassword).toBeVisible();
      await expect(updateButton).toHaveCount(0);
    });

    await test.step("Cancel restores the collapsed state", async () => {
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(updateButton).toBeVisible();
      await expect(currentPassword).toHaveCount(0);
    });
  });
});
