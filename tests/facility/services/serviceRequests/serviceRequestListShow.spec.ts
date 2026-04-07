import { expect, test, type Locator, type Page } from "@playwright/test";
import en from "public/locale/en.json";
import { generateServiceRequestTestData } from "tests/facility/patient/encounter/serviceRequests/serviceRequest";
import {
  expectToast,
  selectFromDefinitionCategoryPicker,
} from "tests/helper/ui";
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

async function getAnyLocationId(page: Page, facilityId: string) {
  await page.goto(`/facility/${facilityId}/overview`);
  await page.waitForLoadState("networkidle");

  const links = page.getByRole("link");
  await expect(links.first()).toBeVisible();

  const hrefs = await links.evaluateAll((elements) =>
    elements
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => typeof href === "string"),
  );

  const match = hrefs
    .map((href) => ({
      href,
      match: href.match(
        new RegExp(`/facility/${facilityId}/locations/([^/]+)`),
      ),
    }))
    .find((x) => x.match?.[1]);

  const locationId = match?.match?.[1];
  if (!locationId) {
    throw new Error(
      `Could not find a location link for facility ${facilityId} on overview page.`,
    );
  }

  return locationId;
}

async function createEncounterServiceRequest(
  page: Page,
  params: {
    facilityId: string;
    patientId: string;
    encounterId: string;
  },
): Promise<CreatedServiceRequest> {
  const data = generateServiceRequestTestData(false);

  await page.goto(
    `/facility/${params.facilityId}/patient/${params.patientId}/encounter/${params.encounterId}/service_requests`,
  );
  await page.waitForLoadState("networkidle");

  await page
    .getByRole("button", { name: tr("create_service_request") })
    .click();

  const activityDefinitionPicker = page
    .getByRole("combobox")
    .filter({ hasText: tr("select_activity_definition") })
    .first();
  await expect(activityDefinitionPicker).toBeVisible();

  await selectFromDefinitionCategoryPicker(page, activityDefinitionPicker, {
    navigateCategories: data.navigateCategories,
    search: data.activityDefinition,
  });

  await expect(
    page
      .getByRole("combobox")
      .filter({ hasText: data.activityDefinition })
      .first(),
  ).toBeVisible();

  await page.getByRole("button", { name: tr("submit") }).click();
  await expectToast(page, tr("questionnaire_submitted_successfully"));
  await page.waitForLoadState("networkidle");

  return { activityDefinition: data.activityDefinition };
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
      locationId = await getAnyLocationId(page, facilityId);
      created = await createEncounterServiceRequest(page, {
        facilityId,
        patientId,
        encounterId,
      });
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
