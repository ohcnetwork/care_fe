import { expect, test } from "@playwright/test";

import { getFieldErrorMessage } from "tests/helper/error";
import {
  createActivityDefinition,
  RESOURCE_CATEGORY_SLUG,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.describe("activity definition form", () => {
  test("validate required fields", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}`,
    );
    await page
      .getByRole("button", { name: /add activity definition/i })
      .click();
    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Title *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Slug *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(
        page.getByRole("textbox", { name: "Description *" }),
      ),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Usage *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(page.getByRole("combobox", { name: "Category *" })),
    ).toBeVisible();

    await expect(
      getFieldErrorMessage(page.getByRole("combobox", { name: "Code *" })),
    ).toBeVisible();

    const slugInput = page.getByRole("textbox", { name: "Slug *" });
    await slugInput.click();
    await slugInput.fill("abc");
    await expect(getFieldErrorMessage(slugInput)).toContainText(
      /atleast 5.*atmost 25/i,
    );
  });

  test("should create activity definition with required fields", async ({
    page,
  }) => {
    const createdData = await createActivityDefinition(page, facilityId);

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdData.slug}`,
    );

    // Verify details
    await expect(
      page.getByRole("heading", { name: createdData.title }),
    ).toBeVisible();

    await expect(page.getByText(createdData.status)).toBeVisible();

    const overviewCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: "Overview" }),
    });
    await expect(overviewCard).toBeVisible();
    await expect(
      overviewCard.getByText(createdData.resourceCategoryName),
    ).toBeVisible();
    await expect(overviewCard.getByText(createdData.description)).toBeVisible();
    await expect(overviewCard.getByText(createdData.usage)).toBeVisible();

    const technicalDetailsCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Technical Details",
      }),
    });
    await expect(
      technicalDetailsCard.getByText("Service Request"),
    ).toBeVisible();
  });

  test("should create activity definition with all fields", async ({
    page,
  }) => {
    const createdData = await createActivityDefinition(page, facilityId, true);

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdData.slug}`,
    );

    // Verify details
    await expect(
      page.getByRole("heading", { name: createdData.title }),
    ).toBeVisible();
    await expect(page.getByText(createdData.status)).toBeVisible();

    const overviewCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Overview",
      }),
    });
    await expect(overviewCard).toBeVisible();
    await expect(
      overviewCard.getByText(createdData.resourceCategoryName),
    ).toBeVisible();
    await expect(overviewCard.getByText(createdData.description)).toBeVisible();
    await expect(overviewCard.getByText(createdData.usage)).toBeVisible();

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
      technicalDetailsCard.getByText(createdData.code),
    ).toBeVisible();
    await expect(
      technicalDetailsCard.getByText(createdData.bodySite!),
    ).toBeVisible();

    const specimenCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Specimen Requirements",
      }),
    });
    await expect(specimenCard).toBeVisible();
    await expect(
      specimenCard.getByText(createdData.specimen!).first(),
    ).toBeVisible();

    const observationCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Observation Result Requirements",
      }),
    });
    await expect(observationCard).toBeVisible();
    await expect(
      observationCard.getByText(createdData.observation!).first(),
    ).toBeVisible();

    const chargeItemCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Charge Item Definitions",
      }),
    });
    await expect(chargeItemCard).toBeVisible();
    await expect(
      chargeItemCard.getByText(createdData.chargeItem!).first(),
    ).toBeVisible();

    const locationCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Locations",
      }),
    });
    await expect(locationCard).toBeVisible();
    await expect(locationCard.getByText(createdData.location!)).toBeVisible();

    const diagnosticCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Diagnostic Report",
      }),
    });
    await expect(diagnosticCard).toBeVisible();
    await expect(
      diagnosticCard.getByText(createdData.diagnosticReportCode!),
    ).toBeVisible();

    const derivedFromCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: "Derived From",
      }),
    });
    await expect(derivedFromCard).toBeVisible();
    await expect(
      derivedFromCard.getByText(createdData.derivedFromUri),
    ).toBeVisible();
  });
});
