import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { selectComboboxOption } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Resource Request Creation", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async () => {
    // A patient of this test's own, not the first encounter in a shared list
    // that parallel tests keep changing.
    facilityId = getFacilityId();
    ({ patientId } = await createQuestionnaireEncounter(facilityId));
  });

  test("Create a new resource request and verify it in patient resources tab", async ({
    page,
  }) => {
    const title = `Resource ${faker.string.alphanumeric(6)}`;
    const reason = faker.lorem.sentence();
    const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;
    const category = "Medicines";

    await test.step("Navigate to patient details", async () => {
      await page.goto(`/facility/${facilityId}/patient/${patientId}`);
    });

    await test.step("Navigate to Requests tab and create request", async () => {
      await page.getByRole("tab", { name: "Requests" }).click();
      await page.getByRole("link", { name: "Create Request" }).click();
    });

    await test.step("Fill and submit resource request form", async () => {
      await selectComboboxOption(
        page.getByRole("combobox", { name: "Category" }),
        { name: category },
      );
      await page.getByRole("textbox", { name: "Title" }).fill(title);
      await page.getByRole("textbox", { name: "Reason" }).fill(reason);
      await selectComboboxOption(
        page
          .getByRole("combobox")
          .filter({ hasText: "Start typing to search..." }),
      );
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
