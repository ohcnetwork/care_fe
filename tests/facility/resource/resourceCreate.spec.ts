import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Resource request create", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page.goto(`/facility/${getFacilityId()}/resource/new`);

    const whitespace = "   ";
    const fields = [
      "Request Title *",
      "Reason for Request *",
      "Name of Contact Person at Facility *",
    ];

    for (const field of fields) {
      await page.getByRole("textbox", { name: field }).fill(whitespace);
    }

    await page.getByRole("button", { name: "Submit" }).click();

    for (const field of fields) {
      const errorMessage = getFieldErrorMessage(
        page.getByRole("textbox", { name: field }),
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("This field is required");
    }
  });
});
