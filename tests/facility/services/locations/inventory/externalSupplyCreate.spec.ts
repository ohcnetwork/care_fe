import { expect, test } from "@playwright/test";
import { openServiceLocation } from "tests/facility/services/helpers";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let pharmacyPath: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  pharmacyPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Main Pharmacy",
    "Pharmacy",
  );
  await context.close();
});

test.describe("Purchase order create", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page.goto(`${pharmacyPath}/inventory/external/orders/outgoing/new`);

    const nameField = page.getByRole("textbox", { name: "Name" });
    await nameField.fill("   ");

    await page.getByRole("button", { name: "Create" }).click();

    const errorMessage = getFieldErrorMessage(nameField);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Name is required");
  });
});

test.describe("Delivery order create", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    await page.goto(
      `${pharmacyPath}/inventory/external/deliveries/incoming/new`,
    );

    const nameField = page.getByRole("textbox", { name: "Name" });
    await nameField.fill("   ");

    await page.getByRole("button", { name: "Create" }).click();

    const errorMessage = getFieldErrorMessage(nameField);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Name is required");
  });
});
