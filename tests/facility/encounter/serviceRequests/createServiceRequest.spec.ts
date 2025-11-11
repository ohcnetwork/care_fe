import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  expectToast,
  selectFromDefinitionCategoryPicker,
  selectFromValueSet,
} from "tests/helpers/ui";
import { getEncounterMetadata } from "tests/support/encounterId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(async () => {
  const metadata = getEncounterMetadata();
  facilityId = metadata.facilityId;
  patientId = metadata.patientId;
  encounterId = metadata.encounterId;
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
  );
});

test.describe("Patient Service Request Tab", () => {
  test("should create a service request with lab test selection", async ({
    page,
  }) => {
    await expect(
      page
        .locator('[data-slot="card-content"]')
        .getByText(/no service requests found/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /create service request/i }).click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/service_request`,
    );

    await expect(
      page.getByRole("heading", { name: /service request/i }),
    ).toBeVisible();

    const patientInstruction = faker.lorem.sentence();
    const notes = faker.lorem.sentence();

    // Wait for the activity definition picker to be ready
    const activityDefinitionPicker = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /select activity definition/i });
    await activityDefinitionPicker.waitFor({ state: "visible" });

    await selectFromDefinitionCategoryPicker(page, activityDefinitionPicker, {
      navigateCategories: ["Lab Tests"],
      search: "Complete Blood Count (CBC) Panel",
      itemIndex: 0,
    });

    const bodySiteSelector = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /body site/i });
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: "Blood",
    });

    await page
      .getByPlaceholder(/enter patient instruction/i)
      .fill(patientInstruction);

    await page.getByPlaceholder(/add note/i).fill(notes);

    await page.getByRole("button", { name: /add/i }).click();
    await page.getByRole("button", { name: /submit/i }).click();

    await expectToast(page, /questionnaire submitted successfully/i);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await page.getByRole("tab", { name: /service requests/i }).click();
    await expect(page).toHaveURL(/\/service_requests$/);

    await expect(
      page.getByText("Complete Blood Count (CBC) Panel"),
    ).toBeVisible();
  });
});
