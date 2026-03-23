import { expect, test, type Page } from "@playwright/test";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { createServiceRequest } from "tests/facility/patient/encounter/serviceRequests/serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

interface ServiceRequestRouteContext {
  locationId: string;
  serviceRequestId: string;
}

let facilityId: string;
let patientId: string;
let encounterId: string;

async function createServiceRequestAndGetRouteContext(
  page: Page,
): Promise<ServiceRequestRouteContext> {
  await createServiceRequest(page, facilityId, patientId, encounterId);

  await clickTabOrMenuItem(page, /service requests/i);
  await expect(page).toHaveURL(/\/service_requests$/);

  const firstRow = page
    .locator('[data-slot="table-body"] [data-slot="table-row"]')
    .first();

  await expect(firstRow).toBeVisible();
  await firstRow.getByRole("button", { name: /see details/i }).click();

  await expect(page).toHaveURL(
    /\/facility\/[a-f0-9-]+\/locations\/[a-f0-9-]+\/service_requests\/[a-f0-9-]+$/i,
  );

  const match = page
    .url()
    .match(/\/locations\/([a-f0-9-]+)\/service_requests\/([a-f0-9-]+)$/i);

  if (!match) {
    throw new Error("Failed to extract locationId/serviceRequestId from URL");
  }

  return {
    locationId: match[1],
    serviceRequestId: match[2],
  };
}

test.describe("Facility Service Request List and Show", () => {
  test.beforeAll(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  test("location-scoped service request list loads and rows are visible", async ({
    page,
  }) => {
    const routeContext = await createServiceRequestAndGetRouteContext(page);

    await page.goto(
      `/facility/${facilityId}/locations/${routeContext.locationId}/service_requests`,
    );

    await expect(
      page.getByRole("heading", { name: /service requests/i }),
    ).toBeVisible();

    const firstListRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(firstListRow).toBeVisible();
    await expect(
      firstListRow.getByRole("button", { name: /see details/i }),
    ).toBeVisible();
  });

  test("status filter updates list state", async ({ page }) => {
    const routeContext = await createServiceRequestAndGetRouteContext(page);

    await page.goto(
      `/facility/${facilityId}/locations/${routeContext.locationId}/service_requests`,
    );

    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();
    await page.getByRole("tab", { name: /completed/i }).click();

    await expect(
      page.getByRole("heading", { name: /no service requests found/i }),
    ).toBeVisible();

    await page.getByRole("tab", { name: /active/i }).click();

    const firstListRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(firstListRow).toBeVisible();
    await expect(firstListRow.getByText(/active/i).first()).toBeVisible();
  });

  test("service request show page renders specimen workflow", async ({
    page,
  }) => {
    const routeContext = await createServiceRequestAndGetRouteContext(page);

    await page.goto(
      `/facility/${facilityId}/locations/${routeContext.locationId}/service_requests`,
    );

    const firstListRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(firstListRow).toBeVisible();
    await firstListRow.getByRole("button", { name: /see details/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`${routeContext.serviceRequestId}$`, "i"),
    );

    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /specimens/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /collect specimen/i }).first(),
    ).toBeVisible();
  });
});
