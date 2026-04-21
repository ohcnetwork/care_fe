import { expect, test } from "@playwright/test";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { createServiceRequest } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(async () => {
  encounterId = getEncounterId();
  facilityId = getFacilityId();
  patientId = getPatientId();
});

test.describe("Patient Service Request Tab", () => {
  test("should create a service request with required fields", async ({
    page,
  }) => {
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
    );

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await clickTabOrMenuItem(page, /service requests/i);
    await expect(page).toHaveURL(/\/service_requests$/);

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(
      firstRow.getByText(serviceRequestData.activityDefinition).first(),
    ).toBeVisible();

    await expect(firstRow.getByText("Active")).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.priority)).toBeVisible();
  });

  test("should create a service request with all fields", async ({ page }) => {
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      true,
    );

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await clickTabOrMenuItem(page, /service requests/i);
    await expect(page).toHaveURL(/\/service_requests$/);

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(
      firstRow.getByText(serviceRequestData.activityDefinition).first(),
    ).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.status)).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.priority)).toBeVisible();

    // Verify details in the detail view
    await firstRow.getByRole("button", { name: "See Details" }).click();

    await expect(
      page
        .locator("div")
        .filter({ hasText: serviceRequestData.activityDefinition })
        .first(),
    ).toBeVisible();

    await expect(page.getByText(serviceRequestData.notes!)).toBeVisible();

    await expect(
      page
        .locator("div")
        .filter({ hasText: serviceRequestData.requestor! })
        .first(),
    ).toBeVisible();
  });
});
