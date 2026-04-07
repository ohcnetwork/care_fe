import { expect, test, type Locator, type Page } from "@playwright/test";
import en from "public/locale/en.json";
import { createServiceRequest } from "tests/facility/patient/encounter/serviceRequests/serviceRequest";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

function tr(key: string) {
  const value = (en as Record<string, unknown>)[key];
  if (typeof value !== "string") {
    throw new Error(`Missing or non-string i18n key: ${key}`);
  }
  return value;
}

interface CreatedServiceRequest {
  activityDefinition: string;
  activityDefinitionSlug: string;
  priority: string;
  serviceRequestId: string;
}

async function getLocationIdFromServiceRequestShow(
  page: Page,
  facilityId: string,
  serviceRequestId: string,
) {
  const retrievePathSubstring = `/api/v1/facility/${facilityId}/service_request/${serviceRequestId}`;
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      response.url().includes(retrievePathSubstring) &&
      response.ok(),
    { timeout: 45_000 },
  );

  await page.goto(
    `/facility/${facilityId}/service_requests/${serviceRequestId}`,
  );
  const response = await responsePromise;
  await page.waitForLoadState("networkidle");

  const data = (await response.json()) as {
    locations?: Array<{ id?: string }>;
    encounter?: { current_location?: { id?: string } };
    activity_definition?: { slug?: string };
  };

  const locationId =
    data.locations?.find((x) => typeof x.id === "string")?.id ??
    data.encounter?.current_location?.id ??
    null;

  if (locationId) return locationId;

  throw new Error(
    `Could not resolve a locationId from service request ${serviceRequestId} for facility ${facilityId}.`,
  );
}

async function getActivityDefinitionSlugFromServiceRequestShow(
  page: Page,
  facilityId: string,
  serviceRequestId: string,
) {
  const retrievePathSubstring = `/api/v1/facility/${facilityId}/service_request/${serviceRequestId}`;
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      response.url().includes(retrievePathSubstring) &&
      response.ok(),
    { timeout: 45_000 },
  );

  await page.goto(
    `/facility/${facilityId}/service_requests/${serviceRequestId}`,
  );
  const response = await responsePromise;
  await page.waitForLoadState("networkidle");

  const data = (await response.json()) as {
    activity_definition?: { slug?: string };
  };
  const slug = data.activity_definition?.slug;
  if (slug) return slug;

  throw new Error(
    `Could not resolve activity definition slug from service request ${serviceRequestId} for facility ${facilityId}.`,
  );
}

async function openServiceRequestList(
  page: Page,
  params: { facilityId: string; locationId: string },
) {
  await page.goto(
    `/facility/${params.facilityId}/locations/${params.locationId}/service_requests`,
  );
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: tr("service_requests") }),
  ).toBeVisible();
}

async function getServiceRequestTable(page: Page) {
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  return table;
}

function rowForCreated(
  table: Locator,
  created: Pick<CreatedServiceRequest, "activityDefinition" | "priority">,
) {
  return table
    .getByRole("row")
    .filter({ hasText: created.activityDefinition })
    .filter({ hasText: created.priority })
    .first();
}

test.use({ storageState: "tests/.auth/user.json" });

test.describe.configure({ mode: "serial" });

test.describe("Facility Service Requests (List + Show)", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  let listShowFixture: {
    locationId: string;
    created: CreatedServiceRequest;
  } | null = null;
  let listShowFixtureInit: Promise<void> | null = null;

  async function ensureListShowFixture(page: Page) {
    if (listShowFixture) return listShowFixture;
    if (!listShowFixtureInit) {
      listShowFixtureInit = (async () => {
        const data = await createServiceRequest(
          page,
          facilityId,
          patientId,
          encounterId,
          false,
        );

        await page.goto(
          `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
        );
        await page.waitForLoadState("networkidle");

        const serviceRequestsTab = page.getByRole("tab", {
          name: /service requests/i,
        });
        await expect(serviceRequestsTab).toBeVisible();
        await serviceRequestsTab.click();
        await page.waitForLoadState("networkidle");

        const encounterTable = await getServiceRequestTable(page);
        const encounterRow = rowForCreated(encounterTable, {
          activityDefinition: data.activityDefinition,
          priority: data.priority,
        });
        await expect(encounterRow).toBeVisible();
        await encounterRow
          .getByRole("button", { name: tr("see_details") })
          .click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/service_requests\/[^/]+$/);
        const url = page.url();
        const serviceRequestId = url
          .split("/service_requests/")[1]
          ?.split(/[/?#]/)[0];
        if (!serviceRequestId) {
          throw new Error(
            `Failed to extract serviceRequestId from URL: ${url}`,
          );
        }

        const locationIdResolved = await getLocationIdFromServiceRequestShow(
          page,
          facilityId,
          serviceRequestId,
        );
        const activityDefinitionSlug =
          await getActivityDefinitionSlugFromServiceRequestShow(
            page,
            facilityId,
            serviceRequestId,
          );

        listShowFixture = {
          locationId: locationIdResolved,
          created: {
            activityDefinition: data.activityDefinition,
            activityDefinitionSlug,
            priority: data.priority,
            serviceRequestId,
          },
        };
      })();
    }
    await listShowFixtureInit;
    if (!listShowFixture) {
      throw new Error("List + show fixture failed to initialize");
    }
    return listShowFixture;
  }

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  test("Navigate to facility service request list and verify rows are visible", async ({
    page,
  }) => {
    const { locationId, created } = await ensureListShowFixture(page);

    await test.step("Open facility location service request list", async () => {
      await openServiceRequestList(page, { facilityId, locationId });
      await expect(page).toHaveURL(/\/service_requests/);
    });

    await test.step("Verify table renders with at least one data row", async () => {
      const rows = (await getServiceRequestTable(page)).getByRole("row");
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(1);
    });

    await test.step("Verify the newly created service request is visible as a row", async () => {
      const table = await getServiceRequestTable(page);
      await expect(rowForCreated(table, created)).toBeVisible();
    });
  });

  test("Filter by activity definition, date range, and status", async ({
    page,
  }) => {
    const { locationId, created } = await ensureListShowFixture(page);
    await openServiceRequestList(page, { facilityId, locationId });

    await test.step("Filter by activity definition", async () => {
      const url = new URL(page.url());
      url.searchParams.set(
        "activity_definition",
        created.activityDefinitionSlug,
      );

      const listPathPart = `/api/v1/facility/${facilityId}/service_request/`;
      const responsePromise = page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          r.url().includes(listPathPart) &&
          r
            .url()
            .includes(
              `activity_definition=${created.activityDefinitionSlug}`,
            ) &&
          (r.ok() || r.status() === 304),
        { timeout: 45_000 },
      );

      await page.goto(url.toString());
      await responsePromise;
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(
        new RegExp(`activity_definition=${created.activityDefinitionSlug}`),
      );

      const table = await getServiceRequestTable(page);
      const dataRows = table.getByRole("row").filter({
        has: page.getByRole("button", { name: tr("see_details") }),
      });
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i += 1) {
        await expect(dataRows.nth(i)).toContainText(created.activityDefinition);
      }
    });

    await test.step("Filter by date range", async () => {
      await page.getByRole("button", { name: tr("filters") }).click();
      await page.getByRole("menuitem", { name: tr("date") }).click();

      await page.getByRole("menuitem", { name: tr("today") }).click();

      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/created_date_(after|before)=/);
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: tr("filters") }).click();
      await page.getByRole("menuitem", { name: tr("date") }).click();
      const todayItem = page
        .getByRole("menuitem", { name: tr("today") })
        .first();
      await expect(todayItem).toHaveClass(/border-green-500/);
      await page.keyboard.press("Escape");
    });

    await test.step("Filter by status using tabs and validate badges", async () => {
      await page.getByRole("tab", { name: tr("active") }).click();
      await expect(page).toHaveURL(/status=active/);
      await page.waitForLoadState("networkidle");

      const table = await getServiceRequestTable(page);
      const dataRows = table.getByRole("row").filter({
        has: page.getByRole("button", { name: tr("see_details") }),
      });
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);
      for (let i = 0; i < rowCount; i += 1) {
        await expect(
          dataRows.nth(i).getByText(tr("active"), { exact: true }),
        ).toBeVisible();
      }
    });
  });

  test("Open a service request and verify specimen workflow card renders", async ({
    page,
  }) => {
    const { created } = await ensureListShowFixture(page);
    await page.goto(
      `/facility/${facilityId}/service_requests/${created.serviceRequestId}`,
    );
    await page.waitForLoadState("networkidle");

    await test.step("Open the matching service request from the list", async () => {
      await expect(
        page.getByRole("button", { name: tr("back") }),
      ).toBeVisible();
    });

    await test.step("Verify specimen workflow section is visible", async () => {
      await expect(
        page.getByRole("heading", { name: tr("specimens") }),
      ).toBeVisible();

      await expect(
        page.getByRole("button", {
          name: tr("specimen_collection_instructions"),
        }),
      ).toBeVisible();
    });
  });
});
