import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Inventory Module (Currently direct Purchase Delivery only)", () => {
  let facilityId: string;
  let testData: {
    orderName: string;
  };

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    testData = {
      orderName: faker.commerce.productName(),
    };

    await page.goto(`/facility/${facilityId}/services`);
  });

  test("Create a purchase delivery (direct)", async ({ page }) => {
    await page.getByRole("link", { name: /Main Pharmacy/i }).click();
    await page.getByRole("link", { name: /View Prescriptions/i }).click();
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Inventory" }).click();
    await page.getByRole("link", { name: "Purchase Deliveries" }).click();
    await page.getByRole("button", { name: "Create Delivery" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(testData.orderName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Vendor" })
      .click();
    await page.waitForSelector('[role="option"]');
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("heading", { name: testData.orderName }),
    ).toBeVisible();

    await page.getByRole("combobox").filter({ hasText: /^$/ }).click();
    await page.getByPlaceholder("Search Product Knowledge").fill("Gloves");
    await page
      .locator("div")
      .filter({ hasText: /^Gloves$/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Add Another Item" }).click();
    await page.getByPlaceholder("Search Product Knowledge").fill("Ibuprofen");
    await page
      .locator("div")
      .filter({ hasText: /^Ibuprofen$/ })
      .first()
      .click();

    await page.getByRole("combobox").nth(2).click();
    await page.getByRole("option").first().click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Search Product" })
      .click();
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: "Add Items" }).click();

    await expect(page.getByText(/Supply Delivery Created/i)).toBeVisible();
    await page.getByRole("button", { name: "Mark as Approved" }).click();

    await expect(
      page.getByText(/Order marked as approved successfully/i),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Mark as Completed/i }),
    ).toBeDisabled();

    await page
      .getByRole("row", { name: "Item Requested Qty. Received" })
      .getByRole("checkbox")
      .click();

    await expect(
      page.getByRole("button", { name: /Mark as Completed/i }),
    ).toBeEnabled();

    await expect(page.getByText("Confirm")).toBeDisabled();

    await page
      .getByRole("row", { name: "Item Requested Qty. Received" })
      .getByRole("checkbox")
      .click();
    await page.getByRole("button", { name: "Confirm & Update Stock" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.getByRole("button", { name: "Mark as Completed" }).click();

    await expect(
      page.getByText(/Order marked as completed successfully/i),
    ).toBeVisible();
  });
});
