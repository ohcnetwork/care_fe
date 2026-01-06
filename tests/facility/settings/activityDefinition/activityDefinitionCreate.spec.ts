import { expect, test } from "@playwright/test";

import {
  createActivityDefinition,
  RESOURCE_CATEGORY_SLUG,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import { getFieldErrorMessage } from "tests/helper/error";
import { getCardByTitle } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.describe("activity definition form", () => {
  test("should show validation errors when trying to save without required fields", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}/new`,
    );

    await page.getByRole("button", { name: "Create" }).click();

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

    const overviewCard = getCardByTitle(page, "Overview");
    await expect(
      overviewCard.getByText(createdData.resourceCategoryName),
    ).toBeVisible();
    await expect(overviewCard.getByText(createdData.description)).toBeVisible();
    await expect(overviewCard.getByText(createdData.usage)).toBeVisible();

    const technicalDetailsCard = getCardByTitle(page, "Technical Details");
    await expect(
      technicalDetailsCard.getByText("Service Request"),
    ).toBeVisible();
    await expect(
      technicalDetailsCard.getByText(createdData.code),
    ).toBeVisible();
    await expect(
      technicalDetailsCard.getByText(createdData.bodySite!),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Specimen Requirements")
        .getByText(createdData.specimen!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Observation Result Requirements")
        .getByText(createdData.observation!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Charge Item Definitions")
        .getByText(createdData.chargeItem!)
        .first(),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Healthcare Service").getByText(
        createdData.healthcareService!,
      ),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Locations").getByText(createdData.location!),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Diagnostic Report").getByText(
        createdData.diagnosticReportCode!,
      ),
    ).toBeVisible();

    await expect(
      getCardByTitle(page, "Derived From").getByText(
        createdData.derivedFromUri!,
      ),
    ).toBeVisible();
  });
});
