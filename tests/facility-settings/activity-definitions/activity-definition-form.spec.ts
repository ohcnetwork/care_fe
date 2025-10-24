import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { ResourceCategoryRead } from "@/src/types/base/resourceCategory/resourceCategory";
import { FacilityRead } from "@/src/types/facility/facility";
import { getResourceCategory, loadFacility } from "@/tests/helpers/helpers";
import {
  closeAnyOpenPopovers,
  selectFromCommand,
  selectFromLocationMultiSelect,
} from "@/tests/helpers/ui";

export interface TestSetup {
  facility: FacilityRead;
  resourceCategory: ResourceCategoryRead;
}

test.use({ storageState: "tests/.auth/user.json" });

function generateActivityDefinitionData() {
  return {
    title: `${faker.science.chemicalElement().name.slice(0, 16)}_${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
    usage: faker.lorem.sentences(2),
  };
}

let setup: TestSetup;

test.beforeAll(async () => {
  const facility = loadFacility();
  const resourceCategory = await getResourceCategory(
    facility.id,
    "activity_definition",
  );
  setup = { facility, resourceCategory };
});

test.describe("Activity Definition Form", () => {
  test("should load the form and display page content", async ({ page }) => {
    await page.goto(
      `/facility/${setup.facility.id}/settings/activity_definitions/categories/${setup.resourceCategory.slug}/new`,
    );

    await expect(
      page.getByRole("heading", { name: /create activity definition/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /basic information/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /additional details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /requirements/i }),
    ).toBeVisible();

    await expect(page.getByLabel(/title.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/slug.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/description.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/usage.*\*/i)).toBeVisible();

    await expect(page.getByLabel(/^status$/i)).toBeVisible();
    await expect(page.getByLabel(/^kind$/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("should fill form with required fields and submit", async ({ page }) => {
    const testData = generateActivityDefinitionData();

    await page.goto(
      `/facility/${setup.facility.id}/settings/activity_definitions/categories/${setup.resourceCategory.slug}/new`,
    );

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

    await expect(page.getByText(setup.resourceCategory.title)).toBeVisible();

    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();

    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await selectFromCommand(page, codeCombobox, {
      placeholder: /search for activity codes/i,
    });

    // Defensive: ensure no overlays are present before clicking Create
    await closeAnyOpenPopovers(page);
    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(
      page.getByText(/activity definition created successfully/i),
    ).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveURL(
      `/facility/${setup.facility.id}/settings/activity_definitions`,
    );
  });

  test("should fill form with all the fields and submit", async ({ page }) => {
    const testData = generateActivityDefinitionData();

    await page.goto(
      `/facility/${setup.facility.id}/settings/activity_definitions/categories/${setup.resourceCategory.slug}/new`,
    );

    await test.step("Basic Information", async () => {
      await page.getByLabel(/title.*\*/i).fill(testData.title);
      await page.getByLabel(/description.*\*/i).fill(testData.description);
      await page.getByLabel(/usage.*\*/i).fill(testData.usage);

      await page.getByLabel(/^status$/i).click();
      await page.getByRole("option", { name: /active/i }).click();

      await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
      await page.getByRole("option").first().click();
      await expect(page.getByText(setup.resourceCategory.title)).toBeVisible();

      await page.getByLabel(/^kind$/i).click();
      await page.getByRole("option", { name: /service request/i }).click();

      const codeCombobox = page.getByRole("combobox", { name: /^code/i });
      await selectFromCommand(page, codeCombobox, {
        placeholder: /search for activity codes/i,
      });

      await page
        .getByLabel(/^derived from uri$/i)
        .fill("https://example.com/uri");
    });

    await test.step("Additional Details", async () => {
      const bodySite = page.getByRole("combobox", { name: /body site/i });
      await selectFromCommand(page, bodySite, {
        placeholder: /select body site/i,
      });
    });

    await test.step("Requirements", async () => {
      const specimenContainer = page
        .getByText(/^specimen requirements$/i)
        .locator("..");
      const specimenTrigger = specimenContainer.getByRole("combobox").first();
      await selectFromCommand(page, specimenTrigger, {
        closeAfterSelect: true,
      });

      const obsContainer = page
        .getByText(/^observation requirements$/i)
        .locator("..");
      const obsTrigger = obsContainer.getByRole("combobox").first();
      await selectFromCommand(page, obsTrigger, { closeAfterSelect: true });

      const chargeContainer = page
        .getByText(/^charge item definitions$/i)
        .locator("..");
      const chargePicker = chargeContainer.getByRole("combobox").first();
      await selectFromCommand(page, chargePicker, { closeAfterSelect: true });

      const locationsSection = page.getByText(/^locations$/i).locator("..");
      await locationsSection.scrollIntoViewIfNeeded();
      const locationsTrigger = locationsSection.getByRole("combobox").first();
      await selectFromLocationMultiSelect(page, locationsTrigger, { index: 0 });
    });

    await test.step("Diagnostic Report", async () => {
      const diagSection = page
        .getByText(/^diagnostic report codes$/i)
        .locator("..");
      const diagCombobox = diagSection.getByRole("combobox").first();
      await selectFromCommand(page, diagCombobox, {
        placeholder: /search for diagnostic codes/i,
      });
    });

    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(
      page.getByText(/activity definition created successfully/i),
    ).toBeVisible();

    await expect(page).toHaveURL(
      `/facility/${setup.facility.id}/settings/activity_definitions`,
    );
  });
});
