import { expect, test } from "@playwright/test";
import { Status } from "src/types/emr/serviceRequest/serviceRequest";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterMetadata } from "tests/support/encounterId";
import { createServiceRequest } from "./serviceRequest";

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

    await expect(
      firstRow.getByText(serviceRequestData.priority, { exact: false }),
    ).toBeVisible();
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

    await expect(
      firstRow.getByText(new RegExp(Status.active, "i")),
    ).toBeVisible();

    await expect(
      firstRow.getByText(serviceRequestData.priority, { exact: false }),
    ).toBeVisible();

    // Verify details in the detail view
    await firstRow.getByRole("button", { name: "See Details" }).click();

    await expect(
      page.getByRole("heading", {
        name: serviceRequestData.activityDefinition,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(serviceRequestData.bodySite!, { exact: false }),
    ).toBeVisible();

    await expect(
      page.getByText(serviceRequestData.patientInstruction!),
    ).toBeVisible();

    await expect(page.getByText(serviceRequestData.notes!)).toBeVisible();
  });
});
