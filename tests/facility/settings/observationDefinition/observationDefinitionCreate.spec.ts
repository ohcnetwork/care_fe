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

  test.describe("Interpretation ranges", () => {
    test("should reject whitespace-only input in required text fields", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();

      const range = page.getByTitle("Range 1");
      const displayInput = range.locator(
        'input[name="qualified_ranges.0.ranges.0.interpretation.display"]',
      );

      await test.step("Fill the range with a whitespace-only display", async () => {
        await displayInput.fill("   ");
        await range.getByPlaceholder("Min", { exact: true }).fill("10");
        await range.getByPlaceholder("Max", { exact: true }).fill("100");
      });

      await page.getByRole("button", { name: "Save", exact: true }).click();

      const errorMessage = getFieldErrorMessage(displayInput);
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("Display is required");
    });
  });
});
