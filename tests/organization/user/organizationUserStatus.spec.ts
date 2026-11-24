import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type {
  Organization,
  OrganizationUserRole,
} from "../../../src/types/organization/organization";
import type {
  CurrentUserRetrieveSpec,
  UserSpec,
} from "../../../src/types/user/user";

// Isolated API fixtures, not a live backend. Organization user lists are
// serialized with the backend's UserSpec, which (unlike UserRetrieveSpec) does
// not include `is_service_account`, so the status badge must not depend on it.
test.use({ storageState: { cookies: [], origins: [] } });

function listUser(overrides: Partial<UserSpec> = {}): UserSpec {
  return {
    id: faker.string.uuid(),
    username: `user-${faker.string.alphanumeric(8).toLowerCase()}`,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone_number: "+919999999999",
    gender: "non_binary",
    last_login: "",
    profile_picture_url: "",
    mfa_enabled: false,
    deleted: false,
    role_orgs: [],
    communication: [],
    qualification: [],
    ...overrides,
  };
}

function userRole(user: UserSpec): OrganizationUserRole {
  return {
    id: faker.string.uuid(),
    user,
    role: {
      id: faker.string.uuid(),
      name: "Staff",
      description: "",
      is_system: true,
      contexts: [],
      permissions: [],
    },
  };
}

const userRow = (page: Page, user: UserSpec) =>
  page.getByRole("row").filter({ hasText: `@${user.username}` });

test.describe("Organization user status badge", () => {
  const organization: Organization = {
    id: faker.string.uuid(),
    name: `Org ${faker.string.alphanumeric(6)}`,
    org_type: "govt",
    level_cache: 0,
    has_children: false,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: null,
    permissions: [],
  };
  const serviceAccount = listUser({ first_name: "Sync", last_name: "Bot" });
  const neverLoggedIn = listUser();
  const activeUser = listUser({ last_login: new Date().toISOString() });

  test.beforeEach(async ({ page }) => {
    const currentUser: CurrentUserRetrieveSpec = {
      ...listUser({ username: "org-status-admin" }),
      email: "",
      flags: [],
      is_service_account: false,
      permissions: [],
      is_superuser: true,
      facilities: [],
      organizations: [organization],
      pf_endpoint: null,
      pf_p256dh: null,
      pf_auth: null,
      preferences: {},
    };

    await page.addInitScript(() => {
      localStorage.setItem("care_access_token", "org-user-status-test");
      localStorage.setItem("i18nextLng", "en");
    });
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") {
        throw new Error(`Unexpected API mutation: ${url.pathname}`);
      }
      if (url.pathname === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({ json: currentUser });
      } else if (url.pathname === `/api/v1/organization/${organization.id}/`) {
        await route.fulfill({ json: organization });
      } else if (
        url.pathname === `/api/v1/organization/${organization.id}/users/`
      ) {
        const results =
          url.searchParams.get("is_service_account") === "true"
            ? [userRole(serviceAccount)]
            : [userRole(neverLoggedIn), userRole(activeUser)];
        await route.fulfill({ json: { count: results.length, results } });
      } else if (url.pathname === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else {
        await route.fulfill({ json: { count: 0, results: [] } });
      }
    });
  });

  test("labels rows on the service accounts tab as service accounts", async ({
    page,
  }) => {
    await page.goto(`/organization/${organization.id}/service_accounts`);

    const row = userRow(page, serviceAccount);
    await expect(row).toBeVisible();
    await expect(
      row.getByText("Service Account", { exact: true }),
    ).toBeVisible();
    await expect(row.getByText("Never Logged In")).toHaveCount(0);
  });

  test("shows login status for regular users", async ({ page }) => {
    await page.goto(`/organization/${organization.id}/users`);

    const neverRow = userRow(page, neverLoggedIn);
    await expect(neverRow).toBeVisible();
    await expect(
      neverRow.getByText("Never Logged In", { exact: true }),
    ).toBeVisible();
    await expect(
      neverRow.getByText("Service Account", { exact: true }),
    ).toHaveCount(0);

    const activeRow = userRow(page, activeUser);
    await expect(activeRow.getByText("Active", { exact: true })).toBeVisible();
  });
});
