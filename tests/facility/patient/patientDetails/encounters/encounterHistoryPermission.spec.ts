import { faker } from "@faker-js/faker";
import { type Browser, expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

/**
 * The empty-state "Create Encounter" button must follow the
 * "can_create_encounter" permission.
 *
 * The Nurse role has the permission. The Staff role does not.
 * Both roles have "can_list_patients", so both see the encounters tab.
 *
 * The test creates a patient with no encounter, and gives both users a role
 * on the geo organization of the patient. This grants real object-level
 * permissions, so no request stub is necessary.
 */

interface ApiListResponse<T> {
  results: T[];
}

async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: getApiHeaders(),
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

async function getGeoOrganizationId(): Promise<string> {
  const { results } = await api<ApiListResponse<{ id: string }>>(
    "/api/v1/organization/?org_type=govt&limit=1",
  );
  const id = results[0]?.id;
  if (!id) throw new Error("No govt organization found");
  return id;
}

async function getRoleId(name: string): Promise<string> {
  const { results } = await api<ApiListResponse<{ id: string; name: string }>>(
    `/api/v1/role/?name=${encodeURIComponent(name)}`,
  );
  const role = results.find((item) => item.name === name);
  if (!role) throw new Error(`Role not found: ${name}`);
  return role.id;
}

async function getUserId(username: string): Promise<string> {
  const user = await api<{ id: string }>(`/api/v1/users/${username}/`);
  return user.id;
}

/**
 * Give the user a role on the organization, so object permissions apply.
 * The function is idempotent, because a test run can repeat on the same
 * database.
 */
async function assignOrganizationRole(
  organizationId: string,
  username: string,
  roleName: string,
) {
  const userId = await getUserId(username);
  const roleId = await getRoleId(roleName);
  const path = `/api/v1/organization/${organizationId}/users/`;

  const { results } = await api<
    ApiListResponse<{
      id: string;
      user: { id: string };
      role: { id: string };
    }>
  >(`${path}?limit=100`);
  const existing = results.find((item) => item.user.id === userId);

  if (!existing) {
    await api(path, { method: "POST", body: { user: userId, role: roleId } });
    return;
  }

  if (existing.role.id !== roleId) {
    await api(`${path}${existing.id}/`, {
      method: "PUT",
      body: { user: userId, role: roleId },
    });
  }
}

/** Create a patient that has no encounter, so the empty state renders. */
async function createPatientWithoutEncounter(
  geoOrganizationId: string,
): Promise<string> {
  const patient = await api<{ id: string }>("/api/v1/patient/", {
    method: "POST",
    body: {
      name: `Encounter Permission ${faker.string.alphanumeric(6)}`,
      gender: "male",
      phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
      date_of_birth: "1990-01-15",
      geo_organization: geoOrganizationId,
      identifiers: [],
    },
  });
  return patient.id;
}

test.describe("Encounter history create button permission", () => {
  // Serial mode keeps both tests in one worker, so the shared setup runs once.
  test.describe.configure({ mode: "serial" });

  const facilityId = getFacilityId();
  let patientId: string;

  test.beforeAll(async () => {
    const geoOrganizationId = await getGeoOrganizationId();
    await assignOrganizationRole(geoOrganizationId, "care-nurse", "Nurse");
    await assignOrganizationRole(geoOrganizationId, "care-staff", "Staff");
    patientId = await createPatientWithoutEncounter(geoOrganizationId);
  });

  /** Open the patient encounters tab as the given user. */
  async function openEncountersTab(browser: Browser, storageState: string) {
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await page.goto(`/facility/${facilityId}/patient/${patientId}/encounters`);
    return { context, page };
  }

  test("shows the create encounter button for a nurse", async ({ browser }) => {
    const { context, page } = await openEncountersTab(
      browser,
      "tests/.auth/nurse.json",
    );

    await expect(page.getByText("No active encounters found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toBeVisible();

    await context.close();
  });

  test("hides the create encounter button for staff", async ({ browser }) => {
    const { context, page } = await openEncountersTab(
      browser,
      "tests/.auth/staff.json",
    );

    await expect(page.getByText("No active encounters found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toHaveCount(0);

    await context.close();
  });
});
