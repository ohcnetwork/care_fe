import { expect, test } from "@playwright/test";
import { Priority, Status } from "src/types/emr/serviceRequest/serviceRequest";
import { createServiceRequest } from "tests/helpers/serviceRequest";
import { clickTabOrMenuItem } from "tests/helpers/ui";
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
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      {
        priority: Priority.urgent,
      },
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
      firstRow.getByText(serviceRequestData.activityDefinition),
    ).toBeVisible();

    await expect(
      firstRow.getByText(new RegExp(Status.active, "i")),
    ).toBeVisible();

    await expect(
      firstRow.getByText(serviceRequestData.priority, { exact: false }),
    ).toBeVisible();
  });
});
