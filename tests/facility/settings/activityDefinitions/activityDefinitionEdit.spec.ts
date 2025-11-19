import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  createActivityDefinition,
  generateActivityDefinitionData,
} from "tests/helpers/activityDefinition";
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

let facilityId: string;
const resourceCategoryName = "Lab Tests";
let createdAD: Awaited<ReturnType<typeof createActivityDefinition>>;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  createdAD = await createActivityDefinition(page, facilityId, {
    resourceCategoryName,
  });
});

test.describe("activity definition edit", () => {
  test("should display all prefilled fields including optional ones", async ({
    page,
  }) => {
    const testData = generateActivityDefinitionData();

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
    await page.getByText(resourceCategoryName).click();
    await page
      .getByRole("button", { name: /add activity definition/i })
      .click();

    await page.getByLabel(/title.*\*/i).fill(testData.title);
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

    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();

    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await selectFromValueSet(page, codeCombobox, {
      itemIndex: 0,
    });

    await page.getByLabel(/^derived from uri$/i).fill(testData.derivedFromUri);

    const bodySite = page.getByRole("combobox", { name: /body site/i });
    await selectFromValueSet(page, bodySite, {
      itemIndex: 0,
    });

    await closeAnyOpenPopovers(page);
    await page.getByRole("button", { name: /^create$/i }).click();

    await expectToast(page, /activity definition created successfully/i);

    await page.getByText(resourceCategoryName).click();

    const clearButton = page
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-x") })
      .first();
    await clearButton.click();

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(testData.title);

    const activityRow = page.locator("tr", { hasText: testData.title });
    await expect(activityRow).toBeVisible();
    await activityRow.getByRole("link", { name: /view/i }).click();

    await page.getByRole("button", { name: /edit/i }).click();

    // Verify all prefilled fields
    await expect(page.getByLabel(/title.*\*/i)).toHaveValue(testData.title);
    await expect(page.getByLabel(/description.*\*/i)).toHaveValue(
      testData.description,
    );
    await expect(page.getByLabel(/usage.*\*/i)).toHaveValue(testData.usage);

    await expect(page.getByLabel(/^status$/i)).toContainText(
      new RegExp(testData.status, "i"),
    );
    await expect(
      page.getByRole("combobox", { name: "Category" }),
    ).toContainText(new RegExp(testData.classification, "i"));
    await expect(page.getByLabel(/^kind$/i)).toContainText(/service request/i);

    await expect(page.getByLabel(/^derived from uri$/i)).toHaveValue(
      testData.derivedFromUri,
    );

    // Verify body site is prefilled
    const bodySiteCombobox = page.getByRole("combobox", {
      name: /body site/i,
    });
    await expect(bodySiteCombobox).not.toBeEmpty();
  });

  test("should edit activity definition with all fields", async ({ page }) => {
    const updatedData = generateActivityDefinitionData();

    await test.step("navigate to edit page", async () => {
      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
      await page.getByText(resourceCategoryName).click();

      const clearButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg.lucide-x") })
        .first();
      await clearButton.click();

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill(createdAD.title);

      const activityRow = page.locator("tr", { hasText: createdAD.title });
      await expect(activityRow).toBeVisible();
      await activityRow.getByRole("link", { name: /view/i }).click();

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

    await test.step("edit fields", async () => {
      await page.getByLabel(/title.*\*/i).fill(updatedData.title);
      await page.getByLabel(/description.*\*/i).fill(updatedData.description);
      await page.getByLabel(/usage.*\*/i).fill(updatedData.usage);

      await page.getByRole("combobox", { name: "Category" }).click();
      await page
        .getByRole("option", {
          name: new RegExp(
            updatedData.classification.replace(/_/g, "\\s"),
            "i",
          ),
        })
        .click();

      await page.getByLabel(/^status$/i).click();
      await page
        .getByRole("option", { name: new RegExp(updatedData.status, "i") })
        .click();

      await page
        .getByLabel(/^derived from uri$/i)
        .fill(updatedData.derivedFromUri);
    });

    await test.step("add additional details", async () => {
      const bodySite = page.getByRole("combobox", { name: /body site/i });
      await selectFromValueSet(page, bodySite, {
        itemIndex: 0,
      });
    });

    await test.step("add additional requirements", async () => {
      const specimenContainer = page
        .getByText(/^specimen requirements$/i)
        .locator("..");
      const specimenTrigger = specimenContainer.getByRole("combobox").first();
      await selectFromRequirements(page, specimenTrigger, {
        itemIndex: faker.number.int({ min: 0, max: 2 }),
      });
      await closeAnyOpenPopovers(page);

      const obsContainer = page
        .getByText(/^observation requirements$/i)
        .locator("..");
      const obsTrigger = obsContainer.getByRole("combobox").first();
      await selectFromRequirements(page, obsTrigger, {
        itemIndex: faker.number.int({ min: 0, max: 2 }),
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
        itemIndex: faker.number.int({ min: 0, max: 2 }),
      });

      const diagSection = page
        .getByText(/^diagnostic report codes$/i)
        .locator("..");
      const diagCombobox = diagSection.getByRole("combobox").first();
      await selectFromValueSet(page, diagCombobox, {
        itemIndex: faker.number.int({ min: 0, max: 4 }),
      });
    });

    await page.getByRole("button", { name: "Save" }).click();

    await expectToast(page, /activity definition updated successfully/i);

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/activity_definitions/.*`),
    );

    await test.step("verify updated details in view page", async () => {
      await expect(
        page.getByRole("heading", { name: updatedData.title }),
      ).toBeVisible();
      await expect(
        page.getByText(updatedData.status, { exact: false }),
      ).toBeVisible();

      const overviewCard = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]', {
          hasText: "Overview",
        }),
      });
      await expect(overviewCard).toBeVisible();
      await expect(overviewCard.getByText(resourceCategoryName)).toBeVisible();
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
        derivedFromCard.getByText(updatedData.derivedFromUri),
      ).toBeVisible();
    });
  });
});
