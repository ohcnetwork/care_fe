import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service Create", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/healthcare_services/new`);
  });

  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    const nameInput = page.getByRole("textbox", { name: "Name" });
    await nameInput.fill("   ");

    await page.getByRole("button", { name: "Create" }).click();

    const errorMessage = getFieldErrorMessage(nameInput);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Name is required");
  });
});
