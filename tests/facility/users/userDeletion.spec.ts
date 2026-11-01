import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("User Deletion Access Control", () => {
  test.describe("Admin User Access", () => {
    test.use({ storageState: "tests/.auth/user.json" });

    test("admin can open deletion from Security and must confirm before deleting", async ({
      page,
    }) => {
      await page.goto(`/facility/${getFacilityId()}/users/care-staff/profile`);
      await page.getByRole("tab", { name: "Security", exact: true }).click();
      const deleteButton = page.getByRole("button", {
        name: "Delete Account",
        exact: true,
      });
      await expect(deleteButton).toBeEnabled();
      await deleteButton.click();

      const dialog = page.getByRole("alertdialog", {
        name: "Verify Account Deletion Request",
      });
      const confirm = dialog.getByRole("button", {
        name: "Delete Account",
        exact: true,
      });
      await expect(confirm).toBeDisabled();
      await dialog.getByPlaceholder("Delete Account").fill("delete");
      await expect(confirm).toBeDisabled();
      await dialog.getByPlaceholder("Delete Account").fill("Delete Account");
      await expect(confirm).toBeEnabled();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(deleteButton).toBeVisible();
    });
  });

  test.describe("Staff User Access", () => {
    test.use({ storageState: "tests/.auth/staff.json" });

    test("staff can manage their own security without access to account deletion", async ({
      page,
    }) => {
      await page.goto(`/facility/${getFacilityId()}/users/care-staff/profile`);
      await page.getByRole("tab", { name: "Security", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Update Password", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Delete Account", exact: true }),
      ).toHaveCount(0);
    });
  });
});
