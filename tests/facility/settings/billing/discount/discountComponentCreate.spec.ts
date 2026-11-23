import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Component Settings", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
  });

  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Create Discount Component" })
      .click();

    const sheet = page.getByRole("dialog");
    await expect(
      sheet.getByRole("heading", { name: "Create Discount Component" }),
    ).toBeVisible();

    const nameInput = sheet.getByRole("textbox", { name: "Name" });
    await nameInput.fill("   ");

    await sheet.getByRole("button", { name: "Save" }).click();

    const errorMessage = getFieldErrorMessage(nameInput);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("This field is required");
  });
});
