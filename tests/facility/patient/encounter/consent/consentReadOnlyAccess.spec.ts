import { faker } from "@faker-js/faker";
import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  type Response,
  test,
} from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { DEFAULT_DISPOSABLE_USER_PASSWORD } from "tests/helper/user";
import { getFacilityId } from "tests/support/facilityId";

/**
 * A user who can read an encounter but cannot write to it must not be able
 * to change its consents. The backend requires
 * "can_write_encounter_clinical_data" to create or edit a consent, or to
 * attach a file to it.
 *
 * The UI still shows "Add Consent", "Edit" and "Add Files" to this user:
 * canWriteSelectedEncounter (EncounterProvider) does not check permissions.
 * So these tests use each action and check that the backend rejects it
 * (403) and that nothing is saved. Once the UI hides these actions for
 * read-only users, change the tests to check that the buttons are absent.
 *
 * No seeded role has encounter read access without write access, so the
 * suite creates one: the Doctor role's read, list and view permissions only.
 * A new user gets this role on the facility root organization. That grants
 * real object-level permissions on the test encounter, so no request stub is
 * needed.
 */

interface RoleRead {
  id: string;
  name: string;
  contexts: string[];
  permissions: { slug: string }[];
}

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

/** Permission slugs that only read data. */
const READ_ONLY_PERMISSION = /^can_(read|list|view)_/;

/** The consent API's message when a write is not allowed. */
const PERMISSION_DENIED = "You do not have permission to update encounter";

const PNG = "tests/fixtures/images/sample_img1.png";

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: adminApiHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `${body === undefined ? "GET" : "POST"} ${path} failed: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

/** Create a facility role with the Doctor role's read-only permissions. */
async function createReadOnlyRole(suffix: string): Promise<string> {
  const { results } = await api<{ results: RoleRead[] }>(
    "/api/v1/role/?name=Doctor&limit=100",
  );
  const doctor = results.find(
    (role) => role.name === "Doctor" && role.contexts.includes("FACILITY"),
  );
  if (!doctor) throw new Error("The seeded facility Doctor role is required");

  const permissions = doctor.permissions
    .map((permission) => permission.slug)
    .filter((slug) => READ_ONLY_PERMISSION.test(slug));
  // The premise of the suite: the role can read encounter clinical data.
  if (!permissions.includes("can_read_encounter_clinical_data")) {
    throw new Error(
      "The Doctor role no longer has can_read_encounter_clinical_data",
    );
  }

  const role = await api<{ id: string }>("/api/v1/role/", {
    name: `Consent Read Only ${suffix}`,
    description: "E2E: reads encounters without write access",
    contexts: doctor.contexts,
    permissions,
  });
  return role.id;
}

/** Create a user with the role on the facility root organization. */
async function createFacilityUser(
  facilityId: string,
  roleId: string,
  suffix: string,
) {
  const username = `consent-readonly-${suffix}`;
  const user = await api<{ id: string }>("/api/v1/users/", {
    username,
    password: DEFAULT_DISPOSABLE_USER_PASSWORD,
    first_name: "Consent",
    last_name: `Reader ${suffix}`,
    email: `${username}@example.test`,
    phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
    gender: "non_binary",
    role_orgs: [],
  });

  const roots = await api<{ results: { id: string }[] }>(
    `/api/v1/facility/${facilityId}/organizations/?org_type=root`,
  );
  if (roots.results.length !== 1) {
    throw new Error(
      `Expected one root organization, found ${roots.results.length}`,
    );
  }
  await api(
    `/api/v1/facility/${facilityId}/organizations/${roots.results[0].id}/users/`,
    { user: user.id, role: roleId },
  );
  return { username, password: DEFAULT_DISPOSABLE_USER_PASSWORD };
}

/** Create an active Treatment consent with a note, as the admin. */
async function createConsent(
  patientId: string,
  encounterId: string,
  note: string,
) {
  const consent = await api<{ id: string }>(
    `/api/v1/patient/${patientId}/consent/`,
    {
      encounter: encounterId,
      status: "active",
      category: "treatment",
      decision: "permit",
      date: new Date().toISOString(),
      period: {},
      note,
    },
  );
  return consent.id;
}

/** Sign in through the login page and return the signed-in storage state. */
async function signIn(
  browser: Browser,
  { username, password }: { username: string; password: string },
): Promise<StorageState> {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /^Good (Morning|Afternoon|Evening), .+/,
    }),
  ).toBeVisible();
  const state = await context.storageState();
  await context.close();
  return state;
}

/** Wait for the API response to a request with this method and path. */
function waitForApi(page: Page, method: string, path: string) {
  return page.waitForResponse(
    (response: Response) =>
      response.request().method() === method &&
      new URL(response.url()).pathname === path,
  );
}

test.describe("Consent access for a read-only user", () => {
  // The tests share one user, patient, encounter and consent. Run them in one
  // worker so the setup runs once; failures stay independent (unlike serial).
  test.describe.configure({ mode: "default" });

  let readOnlyState: StorageState;
  let patientId: string;
  let consentId: string;
  let seededNote: string;
  let consentsUrl: string;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const suffix = faker.string.alphanumeric(8).toLowerCase();
    const facilityId = getFacilityId();
    const roleId = await createReadOnlyRole(suffix);
    const user = await createFacilityUser(facilityId, roleId, suffix);
    patientId = await createTestPatient("Consent Read Only");
    const encounterId = await createTestEncounter(facilityId, patientId);
    seededNote = `Seeded note ${suffix}`;
    consentId = await createConsent(patientId, encounterId, seededNote);
    consentsUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`;
    readOnlyState = await signIn(browser, user);
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({ storageState: readOnlyState });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  /** Consent cards on the tab (other cards also use data-slot="card"). */
  function consentCards() {
    return page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole("button", { name: "See Details" }) });
  }

  /** Open the Consents tab and wait for the consent list. */
  async function goToConsentsTab() {
    await page.goto(consentsUrl);
    await expect(
      page.getByRole("button", { name: "See Details" }).first(),
    ).toBeVisible();
  }

  /** Open the seeded consent's detail page from its card. */
  async function openConsentDetail() {
    await goToConsentsTab();
    await page.getByRole("button", { name: "See Details" }).click();
    await expect(
      page.getByRole("heading", { name: "Consent Details" }),
    ).toBeVisible();
  }

  test("Add Consent → Save is rejected by the backend and no consent is added", async () => {
    await goToConsentsTab();
    await page.getByRole("button", { name: /add.*consent/i }).click();
    const sheet = page.getByRole("dialog", { name: "Add Consent" });
    await expect(sheet).toBeVisible();

    const createResponse = waitForApi(
      page,
      "POST",
      `/api/v1/patient/${patientId}/consent/`,
    );
    await sheet.getByRole("button", { name: "Save" }).click();
    expect((await createResponse).status()).toBe(403);
    await expectToast(page, PERMISSION_DENIED);

    // Reload: only the seeded consent is listed.
    await goToConsentsTab();
    await expect(consentCards()).toHaveCount(1);
  });

  test("Edit → Save is rejected by the backend and the consent is unchanged", async () => {
    const changedNote = `Changed note ${faker.string.alphanumeric(8)}`;

    await openConsentDetail();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Edit Consent" });
    await expect(sheet).toBeVisible();
    await sheet.getByLabel("Note", { exact: true }).fill(changedNote);

    const updateResponse = waitForApi(
      page,
      "PUT",
      `/api/v1/patient/${patientId}/consent/${consentId}/`,
    );
    await sheet.getByRole("button", { name: "Save" }).click();
    expect((await updateResponse).status()).toBe(403);
    await expectToast(page, PERMISSION_DENIED);

    // Reload: the saved note is still the seeded one.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Consent Details" }),
    ).toBeVisible();
    await expect(page.getByText(seededNote)).toBeVisible();
    await expect(page.getByText(changedNote)).toHaveCount(0);
  });

  test("Add Files → Upload is rejected by the backend and no file is attached", async () => {
    const fileName = `Rejected file ${faker.string.alphanumeric(8)}`;

    await openConsentDetail();
    await page.getByRole("button", { name: "Add Files" }).click();
    const fileChooser = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Upload From Device" }).click();
    await (await fileChooser).setFiles(PNG);

    const dialog = page.getByRole("dialog", { name: "Upload File" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("File Name").fill(fileName);

    // The files API rejects with 403. Its message ("Cannot View File") is
    // not specific to uploads, so the test checks the status instead.
    const uploadResponse = waitForApi(page, "POST", "/api/v1/files/");
    await dialog.getByRole("button", { name: "Upload" }).click();
    expect((await uploadResponse).status()).toBe(403);

    // Reload: the consent still has no files.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No files attached" }),
    ).toBeVisible();
    await expect(page.getByText(fileName)).toHaveCount(0);
  });
});
