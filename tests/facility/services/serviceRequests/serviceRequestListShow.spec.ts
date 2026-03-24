import { expect, test, type Page } from "@playwright/test";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { createServiceRequest } from "tests/facility/patient/encounter/serviceRequests/serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

interface ServiceRequestRouteContext {
  serviceRequestId: string;
}

let facilityId: string;
let patientId: string;
let encounterId: string;

async function createServiceRequestAndGetContext(
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
    /\/facility\/[a-f0-9-]+\/service_requests\/[a-f0-9-]+$/i,
  );

  const serviceRequestId = page
    .url()
    .match(/\/service_requests\/([a-f0-9-]+)$/i)?.[1];
  if (!serviceRequestId)
    throw new Error("Failed to extract serviceRequestId from URL");

  await page.getByRole("button", { name: /back/i }).click();
  await expect(page).toHaveURL(/\/service_requests$/);

  return { serviceRequestId };
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
    await createServiceRequestAndGetContext(page);

    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();

    const firstListRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(firstListRow).toBeVisible();
    await expect(
      firstListRow.getByRole("button", { name: /see details/i }),
    ).toBeVisible();
  });

  test("status filter updates list state", async ({ page }) => {
    await createServiceRequestAndGetContext(page);

    const activeTab = page.getByRole("tab", { name: /active/i });
    const completedTab = page.getByRole("tab", { name: /completed/i });

    await expect(activeTab).toBeVisible();
    await expect(completedTab).toBeVisible();

    await completedTab.click();
    await expect(completedTab).toHaveAttribute("data-state", "active");

    await activeTab.click();
    await expect(activeTab).toHaveAttribute("data-state", "active");

    const listRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();
    await expect(listRow).toBeVisible();
    await expect(
      listRow.getByRole("button", { name: /see details/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /active|on hold|completed|draft/i }),
    ).toBeVisible();
  });

  test("service request show page renders specimen workflow", async ({
    page,
  }) => {
    const routeContext = await createServiceRequestAndGetContext(page);
    await page.goto(
      `/facility/${facilityId}/service_requests/${routeContext.serviceRequestId}`,
    );

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/[a-f0-9-]+/service_requests/${routeContext.serviceRequestId}$`,
        "i",
      ),
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
