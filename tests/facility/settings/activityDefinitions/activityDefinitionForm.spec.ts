import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  closeAnyOpenPopovers,
  expectToast,
  selectFromCategoryPicker,
  selectFromLocationMultiSelect,
  selectFromRequirements,
  selectFromValueSet,
} from "tests/helpers/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function generateActivityDefinitionData() {
  return {
    title: `${faker.science.chemicalElement().name.slice(0, 16)}_${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
    usage: faker.lorem.sentences(2),
    derivedFromUri: faker.internet.url(),
  };
}

let facilityId: string;
const categoryName = "Lab Tests";

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
  await page.getByText(categoryName).click();
});

test.describe("activity definition form", () => {
  test("should create activity definition with required fields", async ({
    page,
  }) => {
    const testData = generateActivityDefinitionData();

    await page
      .getByRole("button", { name: /add activity definition/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /create activity definition/i }),
    ).toBeVisible();

    await page.getByLabel(/title.*\*/i).fill(testData.title);
    await page.getByLabel(/description.*\*/i).fill(testData.description);
    await page.getByLabel(/usage.*\*/i).fill(testData.usage);

    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: /active/i }).click();

    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page.getByRole("option").first().click();

    await expect(page.getByText(categoryName)).toBeVisible();

    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();

    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await selectFromValueSet(page, codeCombobox, {
      itemIndex: 0,
    });

    await closeAnyOpenPopovers(page);
    await page.getByRole("button", { name: /^create$/i }).click();

    await expectToast(page, /activity definition created successfully/i);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions`,
    );

    await page.getByText(categoryName).click();

    const activityRow = page.locator("tr", { hasText: testData.title });
    await expect(activityRow).toBeVisible();
    await activityRow.getByRole("link", { name: /view/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/activity_definitions/.*`),
    );

    await expect(
      page.getByRole("heading", { name: testData.title }),
    ).toBeVisible();

    await expect(page.getByText("Active")).toBeVisible();

    const overviewCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: "Overview" }),
    });
    await expect(overviewCard).toBeVisible();
    await expect(overviewCard.getByText(categoryName)).toBeVisible();
    await expect(overviewCard.getByText(testData.description)).toBeVisible();
    await expect(overviewCard.getByText(testData.usage)).toBeVisible();

    const technicalDetailsCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Technical Details",
      }),
    });
    await expect(technicalDetailsCard).toBeVisible();
    await expect(
      technicalDetailsCard.getByText("Service Request"),
    ).toBeVisible();
  });

  test("should create and edit activity definition with all the fields", async ({
    page,
  }) => {
    const testData = generateActivityDefinitionData();

    await test.step("create activity definition", async () => {
      await test.step("fill basic information", async () => {
        await page
          .getByRole("button", { name: /add activity definition/i })
          .click();

        await expect(
          page.getByRole("heading", { name: /create activity definition/i }),
        ).toBeVisible();

        await page.getByLabel(/title.*\*/i).fill(testData.title);
        await page.getByLabel(/description.*\*/i).fill(testData.description);
        await page.getByLabel(/usage.*\*/i).fill(testData.usage);

        await page.getByLabel(/^status$/i).click();
        await page.getByRole("option", { name: /active/i }).click();

        await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
        await page.getByRole("option").first().click();
        await expect(page.getByText(categoryName)).toBeVisible();

        await page.getByLabel(/^kind$/i).click();
        await page.getByRole("option", { name: /service request/i }).click();

        const codeCombobox = page.getByRole("combobox", { name: /^code/i });
        await selectFromValueSet(page, codeCombobox, {
          itemIndex: 0,
        });

        await page
          .getByLabel(/^derived from uri$/i)
          .fill(testData.derivedFromUri);
      });

      await test.step("fill additional details", async () => {
        const bodySite = page.getByRole("combobox", { name: /body site/i });
        await selectFromValueSet(page, bodySite, {
          itemIndex: 0,
        });
      });

      await test.step("select requirements", async () => {
        const specimenContainer = page
          .getByText(/^specimen requirements$/i)
          .locator("..");
        const specimenTrigger = specimenContainer.getByRole("combobox").first();
        await selectFromRequirements(page, specimenTrigger, {
          itemIndex: 0,
        });
        await closeAnyOpenPopovers(page);

        const obsContainer = page
          .getByText(/^observation requirements$/i)
          .locator("..");
        const obsTrigger = obsContainer.getByRole("combobox").first();
        await selectFromRequirements(page, obsTrigger, {
          itemIndex: 0,
        });
        await closeAnyOpenPopovers(page);

        const chargeContainer = page
          .getByText(/^charge item definitions$/i)
          .locator("..");
        const chargePicker = chargeContainer.getByRole("combobox").first();
        await selectFromCategoryPicker(page, chargePicker, {
          closeAfterSelect: true,
        });

        const locationsSection = page.getByText(/^locations$/i).locator("..");
        await locationsSection.scrollIntoViewIfNeeded();
        const locationsTrigger = locationsSection.getByRole("combobox").first();
        await selectFromLocationMultiSelect(page, locationsTrigger, {
          itemIndex: 0,
        });
      });

      await test.step("select diagnostic report codes", async () => {
        const diagSection = page
          .getByText(/^diagnostic report codes$/i)
          .locator("..");
        const diagCombobox = diagSection.getByRole("combobox").first();
        await selectFromValueSet(page, diagCombobox, {
          itemIndex: 0,
        });
      });

      await page.getByRole("button", { name: /^create$/i }).click();

      await expectToast(page, /activity definition created successfully/i);

      await expect(page).toHaveURL(
        `/facility/${facilityId}/settings/activity_definitions`,
      );

      await test.step("navigate and verify details", async () => {
        await page.getByText(categoryName).click();

        const activityRow = page.locator("tr", { hasText: testData.title });
        await expect(activityRow).toBeVisible();
        await activityRow.getByRole("link", { name: /view/i }).click();

        await expect(page).toHaveURL(
          new RegExp(
            `/facility/${facilityId}/settings/activity_definitions/.*`,
          ),
        );

        await expect(
          page.getByRole("heading", { name: testData.title }),
        ).toBeVisible();
        await expect(page.getByText("Active")).toBeVisible();

        const overviewCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Overview",
          }),
        });
        await expect(overviewCard).toBeVisible();
        await expect(overviewCard.getByText(categoryName)).toBeVisible();
        await expect(
          overviewCard.getByText(testData.description),
        ).toBeVisible();
        await expect(overviewCard.getByText(testData.usage)).toBeVisible();

        const technicalDetailsCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Technical Details",
          }),
        });
        await expect(technicalDetailsCard).toBeVisible();
        await expect(
          technicalDetailsCard.getByText("Service Request"),
        ).toBeVisible();

        await expect(page.getByText("Body Site")).toBeVisible();

        const specimenCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Specimen Requirements",
          }),
        });
        await expect(specimenCard).toBeVisible();

        const observationCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Observation Result Requirements",
          }),
        });
        await expect(observationCard).toBeVisible();

        const chargeItemCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Charge Item Definitions",
          }),
        });
        await expect(chargeItemCard).toBeVisible();

        const locationCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Locations",
          }),
        });
        await expect(locationCard).toBeVisible();

        const diagnosticCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Diagnostic Report",
          }),
        });
        await expect(diagnosticCard).toBeVisible();

        const derivedFromCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Derived From",
          }),
        });
        await expect(derivedFromCard).toBeVisible();
        await expect(
          derivedFromCard.getByText(testData.derivedFromUri),
        ).toBeVisible();
      });
    });

    const updatedData = generateActivityDefinitionData();

    await test.step("edit activity definition", async () => {
      await test.step("click edit button", async () => {
        await page.getByRole("button", { name: /edit/i }).click();

        await expect(page).toHaveURL(
          new RegExp(
            `/facility/${facilityId}/settings/activity_definitions/.*/edit`,
          ),
        );

        await expect(
          page.getByRole("heading", { name: /edit activity definition/i }),
        ).toBeVisible();
      });

      await test.step("verify prefilled fields", async () => {
        await expect(page.getByLabel(/title.*\*/i)).toHaveValue(testData.title);
        await expect(page.getByLabel(/description.*\*/i)).toHaveValue(
          testData.description,
        );
        await expect(page.getByLabel(/usage.*\*/i)).toHaveValue(testData.usage);

        await expect(page.getByLabel(/^status$/i)).toContainText(/active/i);
        await expect(
          page.getByRole("combobox", { name: "Category" }),
        ).toContainText("Laboratory");
        await expect(page.getByLabel(/^kind$/i)).toContainText(
          /service request/i,
        );

        await expect(page.getByLabel(/^derived from uri$/i)).toHaveValue(
          testData.derivedFromUri,
        );
      });

      await test.step("edit fields", async () => {
        await page.getByLabel(/title.*\*/i).fill(updatedData.title);
        await page.getByLabel(/description.*\*/i).fill(updatedData.description);
        await page.getByLabel(/usage.*\*/i).fill(updatedData.usage);

        await page.getByRole("combobox", { name: "Category" }).click();
        await page.getByRole("option", { name: "Imaging" }).click();

        await page.getByLabel(/^status$/i).click();
        await page.getByRole("option", { name: /draft/i }).click();

        await page
          .getByLabel(/^derived from uri$/i)
          .fill(updatedData.derivedFromUri);
      });

      await test.step("add additional requirements", async () => {
        const specimenContainer = page
          .getByText(/^specimen requirements$/i)
          .locator("..");
        const specimenTrigger = specimenContainer.getByRole("combobox").first();
        await selectFromRequirements(page, specimenTrigger, {
          itemIndex: 1,
        });
        await closeAnyOpenPopovers(page);

        const obsContainer = page
          .getByText(/^observation requirements$/i)
          .locator("..");
        const obsTrigger = obsContainer.getByRole("combobox").first();
        await selectFromRequirements(page, obsTrigger, {
          itemIndex: 1,
        });
        await closeAnyOpenPopovers(page);

        const chargeContainer = page
          .getByText(/^charge item definitions$/i)
          .locator("..");
        const chargePicker = chargeContainer.getByRole("combobox").first();
        await selectFromCategoryPicker(page, chargePicker, {
          closeAfterSelect: true,
          navigateCategories: ["Lab Tests"],
          itemIndex: 1,
        });

        const locationsSection = page.getByText(/^locations$/i).locator("..");
        await locationsSection.scrollIntoViewIfNeeded();
        const locationsTrigger = locationsSection.getByRole("combobox").first();
        await selectFromLocationMultiSelect(page, locationsTrigger, {
          itemIndex: 1,
        });

        const diagSection = page
          .getByText(/^diagnostic report codes$/i)
          .locator("..");
        const diagCombobox = diagSection.getByRole("combobox").first();
        await selectFromValueSet(page, diagCombobox, {
          itemIndex: 1,
        });
      });

      await page.getByRole("button", { name: "Save" }).click();

      await expectToast(page, /activity definition updated successfully/i);

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/settings/activity_definitions/.*`),
      );
    });

    await test.step("verify updated details in view page", async () => {
      await expect(
        page.getByRole("heading", { name: updatedData.title }),
      ).toBeVisible();
      await expect(page.getByText("Draft")).toBeVisible();

      const overviewCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Overview",
        }),
      });
      await expect(overviewCard).toBeVisible();
      await expect(overviewCard.getByText(categoryName)).toBeVisible();
      await expect(
        overviewCard.getByText(updatedData.description),
      ).toBeVisible();
      await expect(overviewCard.getByText(updatedData.usage)).toBeVisible();

      const technicalDetailsCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Technical Details",
        }),
      });
      await expect(technicalDetailsCard).toBeVisible();
      await expect(
        technicalDetailsCard.getByText("Service Request"),
      ).toBeVisible();

      await expect(page.getByText("Body Site")).toBeVisible();

      const specimenCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Specimen Requirements",
        }),
      });
      await expect(specimenCard).toBeVisible();
      const specimenItems = specimenCard.locator(
        '[data-slot="card-content"] > div > div',
      );
      await expect(specimenItems).toHaveCount(2);

      const observationCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Observation Result Requirements",
        }),
      });
      await expect(observationCard).toBeVisible();
      const observationItems = observationCard.locator(
        '[data-slot="card-content"] > div > div',
      );
      await expect(observationItems).toHaveCount(2);

      const chargeItemCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Charge Item Definitions",
        }),
      });
      await expect(chargeItemCard).toBeVisible();
      const chargeItems = chargeItemCard.locator(
        '[data-slot="card-content"] > div > div',
      );
      await expect(chargeItems).toHaveCount(2);

      const locationCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Locations",
        }),
      });
      await expect(locationCard).toBeVisible();
      const locationItems = locationCard.locator(
        '[data-slot="card-content"] > div > div',
      );
      await expect(locationItems).toHaveCount(2);

      const diagnosticCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Diagnostic Report",
        }),
      });
      await expect(diagnosticCard).toBeVisible();
      const diagnosticItems = diagnosticCard.locator(
        '[data-slot="card-content"] > div > div',
      );
      await expect(diagnosticItems).toHaveCount(2);

      const derivedFromCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Derived From",
        }),
      });
      await expect(derivedFromCard).toBeVisible();
      await expect(
        derivedFromCard.getByText(updatedData.derivedFromUri),
      ).toBeVisible();
    });

    await test.step("delete activity definition", async () => {
      await page.getByRole("button", { name: /delete/i }).click();

      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(/are you sure you want to delete/i),
      ).toBeVisible();

      await dialog.getByRole("button", { name: /confirm/i }).click();

      await expectToast(page, /definition deleted successfully/i);

      await expect(page).toHaveURL(
        `/facility/${facilityId}/settings/activity_definitions`,
      );

      await page.getByText(categoryName).click();

      const activityRow = page.locator("tr", { hasText: updatedData.title });
      await expect(activityRow).not.toBeVisible();
    });
  });
});
