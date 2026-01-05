import { expect, test } from "@playwright/test";

import {
  createActivityDefinition,
  generateActivityDefinitionData,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import {
  closeAnyOpenPopovers,
  expectToast,
  getCardByTitle,
  selectFromCategoryPicker,
  selectFromCommand,
  selectFromLocationMultiSelect,
  selectFromRequirements,
  selectFromValueSet,
} from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.describe("activity definition edit", () => {
  test("should pre-fill all the fields", async ({ page }) => {
    const createdAD = await createActivityDefinition(page, facilityId, true);
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}/edit`,
    );

    await expect(
      page.getByRole("heading", { name: /edit activity definition/i }),
    ).toBeVisible();

    await expect(page.getByLabel(/title.*\*/i)).toHaveValue(createdAD.title);
    await expect(page.getByLabel(/slug/i)).toHaveValue(createdAD.slug);

    await expect(page.getByLabel(/description.*\*/i)).toHaveValue(
      createdAD.description,
    );
    await expect(page.getByLabel(/usage.*\*/i)).toHaveValue(createdAD.usage);

    await expect(page.getByLabel(/^status$/i)).toContainText(createdAD.status);
    await expect(
      page.getByRole("combobox", { name: "Category" }),
    ).toContainText(createdAD.classification);
    await expect(page.getByLabel(/^kind$/i)).toContainText(/service request/i);

    await expect(page.getByRole("combobox", { name: /^code/i })).toContainText(
      createdAD.code,
    );

    await expect(page.getByLabel(/^derived from uri$/i)).toHaveValue(
      createdAD.derivedFromUri!,
    );

    await expect(
      page.getByRole("combobox", { name: /body site/i }),
    ).toContainText(createdAD.bodySite!);

    await expect(
      page
        .locator("div.rounded-lg")
        .filter({
          has: page.locator("label", { hasText: /^specimen requirements$/i }),
        })
        .getByText(createdAD.specimen!)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .locator("div.rounded-lg")
        .filter({
          has: page.locator("label", {
            hasText: /^observation requirements$/i,
          }),
        })
        .getByText(createdAD.observation!)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .locator("div.rounded-lg")
        .filter({
          has: page.locator("label", {
            hasText: /^charge item definitions$/i,
          }),
        })
        .getByText(createdAD.chargeItem!)
        .first(),
    ).toBeVisible();

    await expect(
      page.getByRole("combobox").filter({
        hasText: createdAD.healthcareService!,
      }),
    ).toBeVisible();

    await expect(
      page
        .locator("div.rounded-lg")
        .filter({ has: page.locator("label", { hasText: /^locations$/i }) })
        .getByText(createdAD.location!)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .locator("div.rounded-lg")
        .filter({
          has: page.locator("label", {
            hasText: /^diagnostic report codes$/i,
          }),
        })
        .getByText(createdAD.diagnosticReportCode!)
        .first(),
    ).toBeVisible();
  });

  test("should edit activity definition with all the fields", async ({
    page,
  }) => {
    const createdAD = await createActivityDefinition(page, facilityId);

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}/edit`,
    );

    await expect(
      page.getByRole("heading", { name: /edit activity definition/i }),
    ).toBeVisible();

    const updatedData = generateActivityDefinitionData(true);

    await page.getByLabel(/title.*\*/i).fill(updatedData.title);
    await page.getByLabel(/slug/i).fill(updatedData.slug);
    await page.getByLabel(/description.*\*/i).fill(updatedData.description);
    await page.getByLabel(/usage.*\*/i).fill(updatedData.usage);

    await page.getByRole("combobox", { name: "Category" }).click();
    await page
      .getByRole("option", { name: updatedData.classification })
      .click();

    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: updatedData.status }).click();

    await page
      .getByLabel(/^derived from uri$/i)
      .fill(updatedData.derivedFromUri!);

    const bodySite = page.getByRole("combobox", { name: /body site/i });
    await selectFromValueSet(page, bodySite, {
      search: updatedData.bodySite,
    });

    const specimenTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select specimen requirements/i });
    await selectFromRequirements(page, specimenTrigger, {
      search: updatedData.specimen,
    });
    await closeAnyOpenPopovers(page);

    const obsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select observation requirements/i });
    await selectFromRequirements(page, obsTrigger, {
      search: updatedData.observation,
    });
    await closeAnyOpenPopovers(page);

    const chargePicker = page
      .getByRole("combobox")
      .filter({ hasText: /select.*charge item/i });
    await selectFromCategoryPicker(page, chargePicker, {
      navigateCategories: [updatedData.chargeItemCategory!],
      search: updatedData.chargeItem,
      closeAfterSelect: true,
    });

    const healthcareServiceTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select.*healthcare service/i });
    await selectFromCommand(page, healthcareServiceTrigger, {
      search: "main pharmacy",
      itemIndex: 0,
    });

    const locationsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select.*location/i });
    await selectFromLocationMultiSelect(page, locationsTrigger, {
      search: updatedData.location,
    });

    const diagCombobox = page
      .getByRole("combobox")
      .filter({ hasText: /search.*diagnostic/i });
    await selectFromValueSet(page, diagCombobox, {
      search: updatedData.diagnosticReportCode,
    });

    await page.getByRole("button", { name: "Save" }).click();

    await expectToast(page, /activity definition updated successfully/i);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${updatedData.slug}`,
    );

    // Verify details
    await expect(
      page.getByRole("heading", { name: updatedData.title }),
    ).toBeVisible();
    await expect(page.getByText(updatedData.status)).toBeVisible();

    const overviewCard = getCardByTitle(page, "Overview");
    await expect(
      overviewCard.getByText(createdAD.resourceCategoryName),
    ).toBeVisible();
    await expect(overviewCard.getByText(updatedData.description)).toBeVisible();
    await expect(overviewCard.getByText(updatedData.usage)).toBeVisible();

    const technicalDetailsCard = getCardByTitle(page, "Technical Details");
    await expect(
      technicalDetailsCard.getByText("Service Request"),
    ).toBeVisible();
    await expect(technicalDetailsCard.getByText(createdAD.code)).toBeVisible();
    await expect(
      technicalDetailsCard.getByText(updatedData.bodySite!),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Specimen Requirements")
        .getByText(updatedData.specimen!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Observation Result Requirements")
        .getByText(updatedData.observation!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Charge Item Definitions")
        .getByText(updatedData.chargeItem!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Healthcare Service").getByText("main pharmacy"),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Locations").getByText(updatedData.location!),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Diagnostic Report").getByText(
        updatedData.diagnosticReportCode!,
      ),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Derived From").getByText(
        updatedData.derivedFromUri!,
      ),
    ).toBeVisible();
  });
});
