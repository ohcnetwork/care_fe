import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const LINK_SUCCESS_TOAST = "User linked to department successfully";
const ROLE_UPDATE_TOAST = "User role updated successfully";

interface ApiDepartment {
  id: string;
  name: string;
}

interface ApiRole {
  id: string;
  name: string;
  contexts: string[];
}

interface CurrentUser {
  id: string;
  username: string;
}

// --- API helpers -----------------------------------------------------------
// Departments (facility organizations) and the bulk pagination precondition are
// created via the API, matching the sibling departmentInfiniteScroll.spec.ts.
// The user -> department assignment is driven through the UI (the Link
// Department sheet) wherever it is the behaviour under test.

async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch(`${getApiUrl()}/api/v1/users/getcurrentuser/`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }
  const user = await res.json();
  return { id: user.id, username: user.username };
}

async function fetchFacilityRoles(): Promise<ApiRole[]> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/role/?context=FACILITY&limit=50`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch roles: ${res.status}`);
  }
  const data = await res.json();
  return ((data.results ?? []) as ApiRole[]).filter((role) =>
    role.contexts?.includes("FACILITY"),
  );
}

async function createDepartment(
  facilityId: string,
  name: string,
): Promise<ApiDepartment> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/organizations/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        name,
        description: faker.lorem.sentence(),
        org_type: "dept",
        facility: facilityId,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to create department: ${res.status} — ${await res.text()}`,
    );
  }
  const dept = await res.json();
  return { id: dept.id, name: dept.name };
}

async function assignUserToDepartment(
  facilityId: string,
  organizationId: string,
  userId: string,
  roleId: string,
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/organizations/${organizationId}/users/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ user: userId, role: roleId }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to assign user to department: ${res.status} — ${await res.text()}`,
    );
  }
}

// Unique, search-safe prefix so result counts are deterministic regardless of
// pre-existing departments the user already belongs to.
function uniquePrefix(): string {
  return `dept${faker.string.alphanumeric(8).toLowerCase()}`;
}

test.describe("User Departments Tab", () => {
  let facilityId: string;
  let user: CurrentUser;
  let roles: ApiRole[];

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    user = await fetchCurrentUser();
    roles = await fetchFacilityRoles();
  });

  function searchInput(page: Page) {
    return page.getByRole("textbox", { name: /search departments/i });
  }

  async function gotoDepartmentsTab(page: Page) {
    await page.goto(
      `/facility/${facilityId}/users/${user.username}/departments`,
    );
    await expect(
      page.getByRole("heading", { name: "Departments", exact: true }),
    ).toBeVisible();
  }

  // Links the user to an existing department through the Link Department sheet
  // (the real user journey). `searchTerm` finds the department in the org
  // selector; the success toast is cleared before returning so callers can link
  // several departments in a row without stacked-toast collisions.
  async function linkDepartmentViaSheet(
    page: Page,
    department: ApiDepartment,
    roleName: string,
    searchTerm: string,
  ) {
    await page.getByRole("button", { name: "Link Department" }).click();
    await expect(page.getByText("Link User to Department")).toBeVisible();

    // Switch tab before opening the dropdown (clicking it would close the popover)
    await page.getByRole("tab", { name: "All Organizations" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Department" })
      .click();
    await page.getByPlaceholder("Search Organizations").fill(searchTerm);
    await page.getByRole("option", { name: department.name }).click();

    await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
    await page.getByRole("option", { name: roleName }).first().click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/organizations/${department.id}/users/`) &&
        resp.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Link to Department" }).click();
    const response = await responsePromise;
    expect([200, 201]).toContain(response.status());

    await expectToast(page, LINK_SUCCESS_TOAST);
    // Clear the toast before returning so a subsequent link's assertion does not
    // collide with a still-visible identical toast.
    await expect(
      page.locator(".toaster.group").getByText(LINK_SUCCESS_TOAST),
    ).toHaveCount(0, { timeout: 15000 });
  }

  test("links a department to the user and shows its type and role", async ({
    page,
  }) => {
    const prefix = uniquePrefix();
    const role = roles[0];
    const dept = await createDepartment(facilityId, `${prefix}-cardiology`);

    await gotoDepartmentsTab(page);

    await test.step("Link the department through the sheet", async () => {
      await linkDepartmentViaSheet(page, dept, role.name, prefix);
    });

    await test.step("Verify the card shows name, type and role", async () => {
      await searchInput(page).fill(prefix);
      const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: dept.name });
      await expect(
        card.getByRole("heading", { name: dept.name }),
      ).toBeVisible();
      await expect(card.getByText("Department", { exact: true })).toBeVisible();
      await expect(card.getByText(role.name)).toBeVisible();
    });
  });

  test("filters the list as the user types in search", async ({ page }) => {
    const prefix = uniquePrefix();
    const role = roles[0];
    const alpha = await createDepartment(facilityId, `${prefix}-alpha`);
    const beta = await createDepartment(facilityId, `${prefix}-beta`);

    await gotoDepartmentsTab(page);

    await test.step("Link both departments through the sheet", async () => {
      await linkDepartmentViaSheet(page, alpha, role.name, prefix);
      await linkDepartmentViaSheet(page, beta, role.name, prefix);
    });

    await test.step("Both departments show when searching the shared prefix", async () => {
      await searchInput(page).fill(prefix);
      await expect(
        page.getByRole("heading", { name: alpha.name }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: beta.name }),
      ).toBeVisible();
    });

    await test.step("Narrowing the search filters server-side", async () => {
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/organizations/") &&
          resp.url().includes(`name=${prefix}-alpha`) &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
      );
      await searchInput(page).fill(`${prefix}-alpha`);
      await responsePromise;

      await expect(
        page.getByRole("heading", { name: alpha.name }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: beta.name }),
      ).not.toBeVisible();
    });
  });

  test("shows the empty state when search has no matches", async ({ page }) => {
    await gotoDepartmentsTab(page);

    await searchInput(page).fill(faker.string.uuid());

    await expect(page.getByText("No departments found")).toBeVisible();
  });

  test("paginates when the user has more than 15 matching departments", async ({
    page,
  }) => {
    const prefix = uniquePrefix();
    const role = roles[0];

    // Bulk precondition: 16 linked departments. Driving 16 sequential Link-sheet
    // flows would be slow and flaky and is not what this test verifies, so the
    // assignment is seeded via the API here.
    await test.step("Seed 16 linked departments via API", async () => {
      await Promise.all(
        Array.from({ length: 16 }, async (_, i) => {
          const dept = await createDepartment(
            facilityId,
            `${prefix}-${String(i + 1).padStart(2, "0")}`,
          );
          await assignUserToDepartment(facilityId, dept.id, user.id, role.id);
        }),
      );
    });

    await gotoDepartmentsTab(page);

    await test.step("First page shows 15 of 16 results", async () => {
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/organizations/") &&
          resp.url().includes(`name=${prefix}`) &&
          resp.url().includes("offset=0") &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
      );
      await searchInput(page).fill(prefix);
      await responsePromise;

      await expect(
        page.getByRole("heading", { name: new RegExp(`^${prefix}-`) }),
      ).toHaveCount(15);
    });

    await test.step("Second page requests offset 15 and shows the remaining result", async () => {
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/organizations/") &&
          resp.url().includes("offset=15") &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
      );
      await page.locator("#page-2").click();
      await responsePromise;

      await expect(
        page.getByRole("heading", { name: new RegExp(`^${prefix}-`) }),
      ).toHaveCount(1);
    });
  });

  test("opens the department detail page when a card is clicked", async ({
    page,
  }) => {
    const prefix = uniquePrefix();
    const role = roles[0];
    const dept = await createDepartment(facilityId, `${prefix}-oncology`);

    await gotoDepartmentsTab(page);
    await linkDepartmentViaSheet(page, dept, role.name, prefix);

    await searchInput(page).fill(prefix);
    await page.getByRole("link", { name: dept.name }).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/settings/departments/${dept.id}/departments`),
    );
    await expect(page.getByRole("heading", { name: dept.name })).toBeVisible();
  });

  test("updates the user's role in a department", async ({ page }) => {
    const prefix = uniquePrefix();
    const roleA = roles[0];
    const roleB = roles[1];
    const dept = await createDepartment(facilityId, `${prefix}-pathology`);

    await gotoDepartmentsTab(page);
    await linkDepartmentViaSheet(page, dept, roleA.name, prefix);

    await searchInput(page).fill(prefix);

    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dept.name });

    await test.step("Open the edit role sheet from the card", async () => {
      await expect(card.getByText(roleA.name)).toBeVisible();
      await card.getByRole("button").click();
      await expect(page.getByText("Edit User Role")).toBeVisible();
    });

    await test.step("Pick a different role and update", async () => {
      await page.getByRole("combobox").filter({ hasText: roleA.name }).click();
      await page.getByRole("option", { name: roleB.name }).first().click();

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/organizations/${dept.id}/users/`) &&
          resp.request().method() === "PUT",
      );
      await page.getByRole("button", { name: "Update Role" }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      await expectToast(page, ROLE_UPDATE_TOAST);
    });

    await test.step("Verify the role badge reflects the new role", async () => {
      await expect(card.getByText(roleB.name)).toBeVisible();
    });
  });
});
