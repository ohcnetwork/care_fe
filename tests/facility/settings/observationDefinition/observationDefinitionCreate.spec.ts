import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Observation Definitions Create", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(
      `/facility/${facilityId}/settings/observation_definitions/new`,
    );
  });

  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    const whitespace = "   ";
    const fields = ["Title *", "Description *"];

    for (const field of fields) {
      await page.getByRole("textbox", { name: field }).fill(whitespace);
    }

    await page.getByRole("button", { name: "Create" }).click();

    for (const field of fields) {
      const errorMessage = getFieldErrorMessage(
        page.getByRole("textbox", { name: field }),
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("This field is required");
    }
  });
});
