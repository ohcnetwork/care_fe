import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Account create", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/accounts`,
    );
    await page.getByRole("button", { name: "Create Account" }).click();

    const sheet = page.getByRole("dialog", { name: "Create Account" });
    const nameField = sheet.getByRole("textbox", { name: "Name *" });
    await nameField.fill("   ");

    await sheet.getByRole("button", { name: "Create", exact: true }).click();

    const errorMessage = getFieldErrorMessage(nameField);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Name is required");
  });
});
