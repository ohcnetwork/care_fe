import { faker } from "@faker-js/faker";
import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { DEFAULT_DISPOSABLE_USER_PASSWORD } from "tests/helper/user";
import { getFacilityId } from "tests/support/facilityId";

/**
 * A user who can read an encounter but cannot write to it must not see the
 * consent write actions: "Add Consent" on the Consents tab, and "Edit" and
 * "Add Files" on the consent detail page. The backend rejects these writes
 * without "can_write_encounter_clinical_data".
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

/** Create an active Treatment consent as the admin. */
async function createConsent(patientId: string, encounterId: string) {
  const consent = await api<{ id: string }>(
    `/api/v1/patient/${patientId}/consent/`,
    {
      encounter: encounterId,
      status: "active",
      category: "treatment",
      decision: "permit",
      date: new Date().toISOString(),
      period: {},
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

test.describe("Consent access for a read-only user", () => {
  // The tests share one user, patient, encounter and consent. Run them in one
  // worker so the setup runs once; failures stay independent (unlike serial).
  test.describe.configure({ mode: "default" });

  let readOnlyState: StorageState;
  let consentsUrl: string;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const suffix = faker.string.alphanumeric(8).toLowerCase();
    const facilityId = getFacilityId();
    const roleId = await createReadOnlyRole(suffix);
    const user = await createFacilityUser(facilityId, roleId, suffix);
    const patientId = await createTestPatient("Consent Read Only");
    const encounterId = await createTestEncounter(facilityId, patientId);
    await createConsent(patientId, encounterId);
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

  /**
   * Open the Consents tab and wait for the seeded consent. The tab renders
   * only after the encounter has loaded, so the write access is final here.
   */
  async function goToConsentsTab() {
    await page.goto(consentsUrl);
    await expect(
      page.getByRole("button", { name: "See Details" }),
    ).toBeVisible();
  }

  /**
   * Open the consent detail page from its card. The encounter is already
   * cached from the tab, so the page renders with the final write access.
   */
  async function openConsentDetail() {
    await goToConsentsTab();
    await page.getByRole("button", { name: "See Details" }).click();
    await expect(
      page.getByRole("heading", { name: "Consent Details" }),
    ).toBeVisible();
  }

  test("consents tab does not show the Add Consent button", async () => {
    await goToConsentsTab();

    await expect(
      page.getByRole("button", { name: /add.*consent/i }),
    ).toHaveCount(0);
  });

  test("consent detail page does not show the Edit button", async () => {
    await openConsentDetail();

    await expect(
      page.getByRole("button", { name: "Edit", exact: true }),
    ).toHaveCount(0);
  });

  test("consent detail page does not show the upload file button", async () => {
    await openConsentDetail();

    await expect(page.getByText("Supporting Documents")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Files" })).toHaveCount(
      0,
    );
  });
});
