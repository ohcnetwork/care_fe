import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  ACTIVITY_DEFINITION_CODES,
  BODY_SITES,
  CHARGE_ITEM_CATEGORIES,
  CHARGE_ITEM_DEFINITIONS,
  DIAGNOSTIC_REPORT_CODES,
  LOCATIONS,
  OBSERVATION_REQUIREMENTS,
  SPECIMEN_DEFINITIONS,
  generateActivityDefinitionData,
  generateExpectedSlug,
} from "tests/helpers/activityDefinition";
import {
  clearFilter,
  closeAnyOpenPopovers,
  expectToast,
  selectFromCategoryPicker,
  selectFromLocationMultiSelect,
  selectFromRequirements,
  selectFromValueSet,
} from "tests/helpers/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
const resourceCategoryName = "Lab Tests";

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
  await page.getByText(resourceCategoryName).click();
});

test.describe("activity definition form", () => {
  test("validate required fields", async ({ page }) => {
    await page
      .getByRole("button", { name: /add activity definition/i })
      .click();
    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText(/title.*required/i)).toBeVisible();
    await expect(page.getByText(/slug.*required/i)).toBeVisible();
    await expect(page.getByText(/description.*required/i)).toBeVisible();
    await expect(page.getByText(/usage.*required/i)).toBeVisible();
    await expect(page.getByText(/category.*required/i)).toBeVisible();
    await expect(page.getByText(/code.*required/i)).toBeVisible();

    const slugInput = page.getByLabel(/slug/i);
    await slugInput.click();
    await slugInput.fill("abc");
    await expect(page.getByText(/slug.*atleast 5.*atmost 25/i)).toBeVisible();
  });

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

    const expectedSlug = generateExpectedSlug(testData.title);
    await expect(page.getByLabel(/slug/i)).toHaveValue(expectedSlug);

    await page.getByLabel(/description.*\*/i).fill(testData.description);
    await page.getByLabel(/usage.*\*/i).fill(testData.usage);

    await page.getByLabel(/^status$/i).click();
    await page
      .getByRole("option", { name: new RegExp(testData.status, "i") })
      .click();

    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page
      .getByRole("option", {
        name: new RegExp(testData.classification.replace(/_/g, "\\s"), "i"),
      })
      .click();
    await expect(page.getByText(resourceCategoryName)).toBeVisible();

    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();

    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    const selectedCode = faker.helpers.arrayElement(ACTIVITY_DEFINITION_CODES);
    await selectFromValueSet(page, codeCombobox, {
      search: selectedCode,
    });

    await closeAnyOpenPopovers(page);
    await page.getByRole("button", { name: /^create$/i }).click();

    await expectToast(page, /activity definition created successfully/i);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions`,
    );

    await page.getByText(resourceCategoryName).click();

    await clearFilter(page);

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(testData.title);

    const activityRow = page.locator("tr", { hasText: testData.title });
    await expect(activityRow).toBeVisible();
    await activityRow.getByRole("link", { name: /view/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/activity_definitions/.*`),
    );

    await expect(
      page.getByRole("heading", { name: testData.title }),
    ).toBeVisible();

    await expect(
      page.getByText(testData.status, { exact: false }),
    ).toBeVisible();

    const overviewCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: "Overview" }),
    });
    await expect(overviewCard).toBeVisible();
    await expect(overviewCard.getByText(resourceCategoryName)).toBeVisible();
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

  test("should create activity definition with all fields", async ({
    page,
  }) => {
    const testData = generateActivityDefinitionData();

    const selectedCode = faker.helpers.arrayElement(ACTIVITY_DEFINITION_CODES);
    const selectedBodySite = faker.helpers.arrayElement(BODY_SITES);
    const selectedSpecimen = faker.helpers.arrayElement(SPECIMEN_DEFINITIONS);
    const selectedObservation = faker.helpers.arrayElement(
      OBSERVATION_REQUIREMENTS,
    );
    const selectedCategory = faker.helpers.arrayElement(CHARGE_ITEM_CATEGORIES);
    const selectedChargeItem = faker.helpers.arrayElement(
      CHARGE_ITEM_DEFINITIONS,
    );
    const selectedLocation = faker.helpers.arrayElement(LOCATIONS);
    const selectedDiagCode = faker.helpers.arrayElement(
      DIAGNOSTIC_REPORT_CODES,
    );

    await test.step("create activity definition", async () => {
      await test.step("fill basic information", async () => {
        await page
          .getByRole("button", { name: /add activity definition/i })
          .click();

        await expect(
          page.getByRole("heading", { name: /create activity definition/i }),
        ).toBeVisible();

        await page.getByLabel(/title.*\*/i).fill(testData.title);

        const expectedSlug = generateExpectedSlug(testData.title);
        await expect(page.getByLabel(/slug/i)).toHaveValue(expectedSlug);

        await page.getByLabel(/description.*\*/i).fill(testData.description);
        await page.getByLabel(/usage.*\*/i).fill(testData.usage);

        await page.getByLabel(/^status$/i).click();
        await page
          .getByRole("option", { name: new RegExp(testData.status, "i") })
          .click();

        await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
        await page
          .getByRole("option", {
            name: new RegExp(testData.classification.replace(/_/g, "\\s"), "i"),
          })
          .click();
        await expect(page.getByText(resourceCategoryName)).toBeVisible();

        await page.getByLabel(/^kind$/i).click();
        await page.getByRole("option", { name: /service request/i }).click();

        const codeCombobox = page.getByRole("combobox", { name: /^code/i });
        await selectFromValueSet(page, codeCombobox, {
          search: selectedCode,
        });

        await page
          .getByLabel(/^derived from uri$/i)
          .fill(testData.derivedFromUri);
      });

      await test.step("fill additional details", async () => {
        const bodySite = page.getByRole("combobox", { name: /body site/i });
        await selectFromValueSet(page, bodySite, {
          search: selectedBodySite,
        });
      });

      await test.step("select requirements", async () => {
        const specimenContainer = page
          .getByText(/^specimen requirements$/i)
          .locator("..");
        const specimenTrigger = specimenContainer.getByRole("combobox").first();
        await selectFromRequirements(page, specimenTrigger, {
          search: selectedSpecimen,
        });
        await closeAnyOpenPopovers(page);

        const obsContainer = page
          .getByText(/^observation requirements$/i)
          .locator("..");
        const obsTrigger = obsContainer.getByRole("combobox").first();
        await selectFromRequirements(page, obsTrigger, {
          search: selectedObservation,
        });
        await closeAnyOpenPopovers(page);

        const chargeContainer = page
          .getByText(/^charge item definitions$/i)
          .locator("..");
        const chargePicker = chargeContainer.getByRole("combobox").first();
        await selectFromCategoryPicker(page, chargePicker, {
          navigateCategories: [selectedCategory],
          search: selectedChargeItem,
          closeAfterSelect: true,
        });

        const locationsSection = page.getByText(/^locations$/i).locator("..");
        await locationsSection.scrollIntoViewIfNeeded();
        const locationsTrigger = locationsSection.getByRole("combobox").first();
        await selectFromLocationMultiSelect(page, locationsTrigger, {
          search: selectedLocation,
        });
      });

      await test.step("select diagnostic report codes", async () => {
        const diagSection = page
          .getByText(/^diagnostic report codes$/i)
          .locator("..");
        const diagCombobox = diagSection.getByRole("combobox").first();
        await selectFromValueSet(page, diagCombobox, {
          search: selectedDiagCode,
        });
      });

      await page.getByRole("button", { name: /^create$/i }).click();

      await expectToast(page, /activity definition created successfully/i);

      await expect(page).toHaveURL(
        `/facility/${facilityId}/settings/activity_definitions`,
      );

      await test.step("navigate and verify details", async () => {
        await page.getByText(resourceCategoryName).click();

        await clearFilter(page);

        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill(testData.title);

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
        await expect(
          page.getByText(testData.status, { exact: false }),
        ).toBeVisible();

        const overviewCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Overview",
          }),
        });
        await expect(overviewCard).toBeVisible();
        await expect(
          overviewCard.getByText(resourceCategoryName),
        ).toBeVisible();
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
        await expect(
          technicalDetailsCard.getByText(selectedCode),
        ).toBeVisible();
        await expect(
          technicalDetailsCard.getByText(selectedBodySite),
        ).toBeVisible();

        const specimenCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Specimen Requirements",
          }),
        });
        await expect(specimenCard).toBeVisible();
        await expect(specimenCard.getByText(selectedSpecimen)).toBeVisible();

        const observationCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Observation Result Requirements",
          }),
        });
        await expect(observationCard).toBeVisible();
        await expect(
          observationCard.getByText(selectedObservation),
        ).toBeVisible();

        const chargeItemCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Charge Item Definitions",
          }),
        });
        await expect(chargeItemCard).toBeVisible();
        await expect(
          chargeItemCard.getByText(selectedChargeItem),
        ).toBeVisible();

        const locationCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Locations",
          }),
        });
        await expect(locationCard).toBeVisible();
        await expect(locationCard.getByText(selectedLocation)).toBeVisible();

        const diagnosticCard = page.locator('[data-slot="card"]').filter({
          has: page.locator('[data-slot="card-title"]', {
            hasText: "Diagnostic Report",
          }),
        });
        await expect(diagnosticCard).toBeVisible();
        await expect(diagnosticCard.getByText(selectedDiagCode)).toBeVisible();

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
  });
});
