import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Resource Request Creation", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  test("Create a new resource request and verify it in patient resources tab", async ({
    page,
  }) => {
    const title = `Resource ${faker.string.alphanumeric(6)}`;
    const reason = faker.lorem.sentence();
    const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;
    const category = "Medicines";

    await test.step("Navigate to patient details", async () => {
      await page.getByText("View Encounter").first().click();
      await page.getByRole("button", { name: /.*Y,.*/ }).click();
      const viewProfileLink = page.getByRole("link", { name: "View Profile" });
      await viewProfileLink.waitFor({ state: "visible" });
      await viewProfileLink.click();
    });

    await test.step("Navigate to Requests tab and create request", async () => {
      await page.getByRole("tab", { name: "Requests" }).click();
      await page.getByRole("link", { name: "Create Request" }).click();
    });

    await test.step("Fill and submit resource request form", async () => {
      await page.getByRole("combobox", { name: "Category" }).click();
      await page.getByRole("option", { name: category }).click();
      await page.getByRole("textbox", { name: "Title" }).fill(title);
      await page.getByRole("textbox", { name: "Reason" }).fill(reason);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Start typing to search..." })
        .click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("textbox", { name: "Name of Contact Person at" })
        .fill(faker.person.fullName());
      await page
        .getByRole("textbox", { name: "Contact Person Number" })
        .fill(phoneNumber);

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/resource/") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Submit" }).click();
      const response = await createResponse;
      expect(response.status()).toBe(200);
    });

    await test.step("Verify resource request in patient resources tab", async () => {
      await page.goto(`/facility/${facilityId}/resource`);

      const resourceCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: title });

      await expect(
        resourceCard.locator('[data-slot="card-title"]'),
      ).toContainText(title);
      await expect(
        resourceCard.locator('[data-slot="card-description"]'),
      ).toContainText(reason);
      await expect(
        resourceCard
          .locator('[data-slot="badge"]')
          .filter({ hasText: category }),
      ).toBeVisible();
    });
  });
});
