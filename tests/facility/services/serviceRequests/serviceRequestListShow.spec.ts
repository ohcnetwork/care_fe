import { expect, test, type Page } from "@playwright/test";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import {
  createServiceRequest,
  type ServiceRequestTestData,
} from "tests/facility/patient/encounter/serviceRequests/serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

interface ServiceRequestRouteContext extends ServiceRequestTestData {
  serviceRequestId: string;
}

let facilityId: string;
let patientId: string;
let encounterId: string;

function serviceRequestMatchingRows(page: Page, data: ServiceRequestTestData) {
  return page
    .locator('[data-slot="table-body"]')
    .getByRole("row")
    .filter({ hasText: data.activityDefinition })
    .filter({ hasText: data.priority })
    .filter({ hasText: "Active" });
}

function newestMatchingServiceRequestRow(
  page: Page,
  data: ServiceRequestTestData,
) {
  return serviceRequestMatchingRows(page, data).first();
}

async function createServiceRequestAndGetContext(
  page: Page,
): Promise<ServiceRequestRouteContext> {
  const serviceRequestData = await createServiceRequest(
    page,
    facilityId,
    patientId,
    encounterId,
  );

  await clickTabOrMenuItem(page, /service requests/i);
  await expect(page).toHaveURL((u) => u.pathname.endsWith("/service_requests"));

  const listUrl = new URL(page.url());
  listUrl.searchParams.set("patient", patientId);
  await page.goto(listUrl.href);
  await page.waitForLoadState("networkidle");

  const matchingRows = serviceRequestMatchingRows(page, serviceRequestData);
  const requestRow = newestMatchingServiceRequestRow(page, serviceRequestData);
  await expect(matchingRows.first()).toBeVisible();

  await requestRow.getByRole("button", { name: /see details/i }).click();
  await expect(page).toHaveURL(
    /\/facility\/[a-f0-9-]+\/(?:locations\/[a-f0-9-]+\/)?service_requests\/[a-f0-9-]+/i,
  );

  const serviceRequestId = page
    .url()
    .match(/\/service_requests\/([a-f0-9-]+)/i)?.[1];
  if (!serviceRequestId)
    throw new Error("Failed to extract serviceRequestId from URL");

  await page.getByRole("button", { name: /back/i }).click();
  await expect(page).toHaveURL((u) => u.pathname.endsWith("/service_requests"));
  await page.waitForLoadState("networkidle");

  return { serviceRequestId, ...serviceRequestData };
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
    const data = await createServiceRequestAndGetContext(page);

    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();

    const requestRow = newestMatchingServiceRequestRow(page, data);
    await expect(
      requestRow.getByText(data.activityDefinition).first(),
    ).toBeVisible();
    await expect(requestRow.getByText("Active")).toBeVisible();
    await expect(requestRow.getByText(data.priority)).toBeVisible();
    await expect(
      requestRow.getByRole("button", { name: /see details/i }),
    ).toBeVisible();
  });

  test("status filter updates list state", async ({ page }) => {
    const data = await createServiceRequestAndGetContext(page);

    const activeTab = page.getByRole("tab", { name: /active/i });
    const completedTab = page.getByRole("tab", { name: /completed/i });

    await expect(activeTab).toBeVisible();
    await expect(completedTab).toBeVisible();

    const matchingRows = serviceRequestMatchingRows(page, data);

    await completedTab.click();
    await page.waitForLoadState("networkidle");
    await expect(completedTab).toHaveAttribute("data-state", "active");
    await expect(matchingRows).toHaveCount(0);

    await activeTab.click();
    await page.waitForLoadState("networkidle");
    await expect(activeTab).toHaveAttribute("data-state", "active");
    await expect(matchingRows.first()).toBeVisible();
    await expect(
      newestMatchingServiceRequestRow(page, data).getByRole("button", {
        name: /see details/i,
      }),
    ).toBeVisible();
  });

  test("service request show page renders specimen workflow", async ({
    page,
  }) => {
    const routeContext = await createServiceRequestAndGetContext(page);
    await page.goto(
      `/facility/${facilityId}/service_requests/${routeContext.serviceRequestId}`,
    );
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/[a-f0-9-]+/service_requests/${routeContext.serviceRequestId}$`,
        "i",
      ),
    );

    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    const specimensHeading = page.getByRole("heading", { name: /specimens/i });
    await expect(specimensHeading).toBeVisible();
    const specimensSection = specimensHeading.locator("..").locator("..");
    await expect(
      specimensSection.getByRole("button", { name: /collect specimen/i }),
    ).toBeVisible();
  });
});
