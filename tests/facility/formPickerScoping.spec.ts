import { expect, test, type Locator, type Page } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const SUBJECT_TYPES = [
  "encounter",
  "patient",
  "location",
  "device",
  "facility",
] as const;
type SubjectType = (typeof SUBJECT_TYPES)[number];
const STATUSES = ["active", "draft", "retired"] as const;
type Status = (typeof STATUSES)[number];

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Instance scope: the only scope that allows `patient`, and facility-page
 *  pickers (facility_or_instance) include instance questionnaires too. */
async function createQuestionnaire(
  title: string,
  status: Status,
  subjectType: SubjectType,
): Promise<string> {
  const { id } = await api<{ id: string }>("/api/v1/questionnaire/", {
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0",
    status,
    subject_type: subjectType,
    auth_context: "instance",
    questions: [
      {
        id: crypto.randomUUID(),
        link_id: "note",
        text: "Note",
        type: "string",
      },
    ],
  });
  return id;
}

/**
 * Every form picker must offer only ACTIVE questionnaires of ITS OWN subject
 * type. One active/draft/retired questionnaire is seeded per subject type
 * under a shared title prefix; each picker is searched by that prefix and
 * must list exactly one of the fifteen.
 */
test.describe("Form pickers offer only active questionnaires of their subject type", () => {
  // One worker, so beforeAll seeds the questionnaires once for all pickers.
  test.describe.configure({ mode: "default" });
  const stamp = Date.now();
  const prefix = `Picker ${stamp}`;
  const titleOf = (subject: SubjectType, status: Status) =>
    `${prefix} ${subject} ${status}`;
  // Mounted on the fill page; its title must not match the search prefix.
  const hostTitle = `Picker Host ${stamp}`;
  let hostId = "";
  let deviceId = "";
  let locationId = "";
  const facilityPath = () => `/facility/${getFacilityId()}`;
  const encounterPath = () =>
    `${facilityPath()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;

  test.beforeAll(async () => {
    for (const subject of SUBJECT_TYPES) {
      for (const status of STATUSES) {
        await createQuestionnaire(titleOf(subject, status), status, subject);
      }
    }
    hostId = await createQuestionnaire(hostTitle, "active", "encounter");
    ({ id: deviceId } = await api<{ id: string }>(
      `/api/v1/facility/${getFacilityId()}/device/`,
      {
        registered_name: `Picker device ${stamp}`,
        status: "active",
        availability_status: "available",
      },
    ));
    ({ id: locationId } = await api<{ id: string }>(
      `/api/v1/facility/${getFacilityId()}/location/`,
      {
        name: `Picker location ${stamp}`,
        description: "",
        form: "wa",
        status: "active",
        operational_status: "O",
        mode: "kind",
        organizations: [],
      },
    ));
  });

  /** Searches the open picker by the prefix and asserts it lists only the
   *  active questionnaire of `subject`. `checkRequest` is off for the
   *  location/device/facility pickers, whose own specs pin the query. */
  async function expectOnlyActiveOf(
    page: Page,
    picker: Locator,
    subject: SubjectType,
    checkRequest = true,
  ) {
    const pickerRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/questionnaire/" &&
        url.searchParams.get("title") === prefix
      );
    });
    await picker.getByPlaceholder("Search Forms").fill(prefix);

    const params = new URL((await pickerRequest).url()).searchParams;
    if (checkRequest) {
      expect(params.get("status")).toBe("active");
      expect(params.get("subject_type")).toBe(subject);
    }

    await expect(
      picker
        .getByRole("option")
        .filter({ hasText: titleOf(subject, "active") }),
    ).toBeVisible();
    await expect(picker.getByRole("option")).toHaveCount(1);
    for (const other of SUBJECT_TYPES) {
      for (const status of STATUSES) {
        if (other === subject && status === "active") continue;
        await expect(
          picker.getByText(titleOf(other, status), { exact: true }),
        ).toHaveCount(0);
      }
    }
  }

  const resourcePicker = (page: Page) =>
    page.getByRole("dialog", { name: "Forms", exact: true });

  test("encounter: overview Forms quick action", async ({ page }) => {
    await page.goto(`${encounterPath()}/updates`);
    await page.getByRole("button", { name: "Forms" }).click();
    await expectOnlyActiveOf(page, page.getByRole("dialog"), "encounter");
  });

  test("encounter: fill page questionnaire selector", async ({ page }) => {
    await page.goto(`${encounterPath()}/questionnaire`);
    await page
      .getByRole("combobox", { name: "Select a questionnaire to fill" })
      .click();
    await expectOnlyActiveOf(page, page.getByRole("dialog"), "encounter");
  });

  test("encounter: Add questionnaire while filling another form", async ({
    page,
  }) => {
    await page.goto(`${encounterPath()}/questionnaire/${hostId}`);
    await page.getByRole("button", { name: "Add questionnaire" }).click();
    await expectOnlyActiveOf(page, page.getByRole("dialog"), "encounter");
  });

  test("patient: fill page questionnaire selector", async ({ page }) => {
    await page.goto(
      `${facilityPath()}/patient/${getPatientId()}/questionnaire`,
    );
    await page
      .getByRole("combobox", { name: "Select a questionnaire to fill" })
      .click();
    await expectOnlyActiveOf(page, page.getByRole("dialog"), "patient");
  });

  test("location: overview Submit forms", async ({ page }) => {
    await page.goto(`${facilityPath()}/locations/${locationId}/overview`);
    await page
      .locator('[data-cy="location-overview-page"]')
      .getByRole("button", { name: /Submit forms/ })
      .click();
    await expectOnlyActiveOf(page, resourcePicker(page), "location", false);
  });

  test("device: detail page Submit forms", async ({ page }) => {
    await page.goto(`${facilityPath()}/settings/devices/${deviceId}`);
    await page
      .getByRole("button", { name: "Submit forms", exact: true })
      .click();
    await expectOnlyActiveOf(page, resourcePicker(page), "device", false);
  });

  test("facility: settings General Submit forms", async ({ page }) => {
    await page.goto(`${facilityPath()}/settings/general`);
    await page
      .locator('[data-cy="facility-forms"]')
      .getByRole("button", { name: /^Submit forms/ })
      .click();
    await expectOnlyActiveOf(page, resourcePicker(page), "facility", false);
  });
});
