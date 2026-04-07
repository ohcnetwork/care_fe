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
}

function extractLocationIdFromUrl(url: string, facilityId: string) {
  return (
    url.match(new RegExp(`/facility/${facilityId}/locations/([^/]+)`))?.[1] ??
    null
  );
}

function extractServiceRequestsLocationIdFromHref(
  href: string,
  facilityId: string,
) {
  return (
    href.match(
      new RegExp(`/facility/${facilityId}/locations/([^/]+)/service_requests`),
    )?.[1] ?? null
  );
}

async function getLinkHrefsWithIndex(page: Page) {
  const links = page.getByRole("link");
  const hasAnyLinks = await links
    .first()
    .isVisible()
    .catch(() => false);
  if (!hasAnyLinks) return [];

  const hrefs = await links.evaluateAll((elements) =>
    elements.map((el) => el.getAttribute("href")),
  );

  return hrefs
    .map((href, index) => ({ href, index }))
    .filter(
      (x): x is { href: string; index: number } => typeof x.href === "string",
    );
}

async function findLocationIdInLinks(page: Page, facilityId: string) {
  const hrefs = await getLinkHrefsWithIndex(page);
  for (const { href } of hrefs) {
    const id = extractLocationIdFromUrl(href, facilityId);
    if (id) return id;
  }

  return null;
}

function isServiceLocationsListHref(href: string, facilityId: string) {
  return new RegExp(
    `^/facility/${facilityId.replace(/-/g, "\\-")}/services/[^/]+/locations$`,
  ).test(href);
}

async function getServiceRequestsLocationId(page: Page, facilityId: string) {
  await page.goto(`/facility/${facilityId}/overview`);
  await page.waitForLoadState("networkidle");

  const overviewLocationId = await findLocationIdInLinks(page, facilityId);
  if (overviewLocationId) return overviewLocationId;

  await page.goto(`/facility/${facilityId}/services`);
  await page.waitForLoadState("networkidle");

  const indexHrefPairs = await getLinkHrefsWithIndex(page);
  const serviceLocationHrefs = indexHrefPairs
    .filter(({ href }) => isServiceLocationsListHref(href, facilityId))
    .map(({ href }) => href);

  for (const locationsHref of serviceLocationHrefs) {
    await page.goto(locationsHref);
    await page.waitForLoadState("networkidle");

    const idFromUrl = extractServiceRequestsLocationIdFromHref(
      page.url(),
      facilityId,
    );
    if (idFromUrl) return idFromUrl;

    const pageHrefs = await getLinkHrefsWithIndex(page);
    for (const { href } of pageHrefs) {
      const id = extractServiceRequestsLocationIdFromHref(href, facilityId);
      if (id) return id;
    }
  }

  throw new Error(
    `Could not resolve a locationId for facility ${facilityId} with a lab /service_requests link (checked each service's locations page).`,
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

function rowForCreated(table: Locator, activityTitle: string) {
  return table.getByRole("row").filter({ hasText: activityTitle }).first();
}

test.use({ storageState: "tests/.auth/user.json" });

test.describe.configure({ mode: "serial" });

test.describe("Facility Service Requests (List + Show)", () => {
  let facilityId: string;
  let locationId: string;
  let patientId: string;
  let encounterId: string;
  let created: CreatedServiceRequest;

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  test("Navigate to facility service request list and verify rows are visible", async ({
    page,
  }) => {
    await test.step("Resolve lab location and create a service request", async () => {
      locationId = await getServiceRequestsLocationId(page, facilityId);
      const data = await createServiceRequest(
        page,
        facilityId,
        patientId,
        encounterId,
        false,
      );
      created = { activityDefinition: data.activityDefinition };
    });

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
      await expect(
        rowForCreated(table, created.activityDefinition),
      ).toBeVisible();
    });
  });

  test("Filter by activity definition, date range, and status", async ({
    page,
  }) => {
    await openServiceRequestList(page, { facilityId, locationId });

    await test.step("Filter by activity definition", async () => {
      await page.getByRole("button", { name: tr("filters") }).click();
      await page
        .getByRole("menuitem", { name: tr("activity_definition") })
        .click();

      const search = page.getByPlaceholder(tr("search_activity_definition"));
      await expect(search).toBeVisible();
      await search.fill(created.activityDefinition);

      await page
        .getByRole("menuitem", { name: created.activityDefinition })
        .first()
        .click();

      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/activity_definition=/);
      await page.waitForLoadState("networkidle");

      const table = await getServiceRequestTable(page);
      await expect(
        rowForCreated(table, created.activityDefinition),
      ).toBeVisible();

      await page.getByRole("button", { name: tr("filters") }).click();
      await page
        .getByRole("menuitem", { name: tr("activity_definition") })
        .click();
      const selectedActivity = page
        .getByRole("menuitem", { name: created.activityDefinition })
        .first();
      await expect(selectedActivity.getByRole("checkbox")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await page.keyboard.press("Escape");
    });

    await test.step("Filter by date range", async () => {
      await page.getByRole("button", { name: tr("filters") }).click();
      await page.getByRole("menuitem", { name: tr("date") }).click();

      await page.getByRole("menuitem", { name: tr("today") }).click();

      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/created_date_(after|before)=/);
      await page.waitForLoadState("networkidle");

      const table = await getServiceRequestTable(page);
      await expect(
        rowForCreated(table, created.activityDefinition),
      ).toBeVisible();
    });

    await test.step("Filter by status using tabs and validate badges", async () => {
      await page.getByRole("tab", { name: tr("active") }).click();
      await expect(page).toHaveURL(/status=active/);
      await page.waitForLoadState("networkidle");

      const table = await getServiceRequestTable(page);
      const createdRow = rowForCreated(table, created.activityDefinition);
      await expect(createdRow).toBeVisible();

      await expect(
        createdRow.getByText(tr("active"), { exact: true }),
      ).toBeVisible();
    });
  });

  test("Open a service request and verify specimen workflow card renders", async ({
    page,
  }) => {
    await openServiceRequestList(page, { facilityId, locationId });

    await test.step("Open the matching service request from the list", async () => {
      const table = await getServiceRequestTable(page);
      const createdRow = rowForCreated(table, created.activityDefinition);

      await createdRow.getByRole("button", { name: tr("see_details") }).click();
      await expect(page).toHaveURL(/\/service_requests\/[^/]+$/);
      await page.waitForLoadState("networkidle");
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
