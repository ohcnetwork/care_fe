import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

async function ensureUsersInAdminOrg(facilityId: string) {
  const apiUrl = getApiUrl();
  const headers = getApiHeaders();

  // Get the Administration organization
  const orgRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/?limit=50`,
    { headers },
  );
  if (!orgRes.ok) return;
  const orgData = await orgRes.json();
  const adminOrg = orgData.results?.find(
    (o: { name: string }) => o.name === "Administration",
  );
  if (!adminOrg) return;

  // Get current members
  const membersRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/${adminOrg.id}/users/`,
    { headers },
  );
  if (!membersRes.ok) return;
  const membersData = await membersRes.json();
  const existingUsernames = (membersData.results ?? []).map(
    (m: { user: { username: string } }) => m.user.username,
  );

  // Users to ensure exist in org with their roles
  const requiredUsers = [
    { username: "care-fac-admin", roleName: "Facility Admin" },
    { username: "care-nurse", roleName: "Nurse" },
  ];

  // Get available roles
  const rolesRes = await fetch(`${apiUrl}/api/v1/role/?limit=50`, { headers });
  if (!rolesRes.ok) return;
  const rolesData = await rolesRes.json();

  for (const req of requiredUsers) {
    if (existingUsernames.includes(req.username)) continue;

    // Find the user
    const userRes = await fetch(
      `${apiUrl}/api/v1/users/?username=${req.username}`,
      { headers },
    );
    if (!userRes.ok) continue;
    const userData = await userRes.json();
    const user = userData.results?.[0];
    if (!user) continue;

    // Find the role
    const role = rolesData.results?.find(
      (r: { name: string; contexts: string[] }) =>
        r.name === req.roleName && r.contexts.includes("FACILITY"),
    );
    if (!role) continue;

    // Add user to org
    await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/${adminOrg.id}/users/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ user: user.id, role: role.id }),
      },
    );
  }
}

test.describe("Account Management Permissions", () => {
  let facilityId: string;

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    await ensureUsersInAdminOrg(facilityId);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to healthcare services
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/billing/account`);
  });

  test.describe("facility admin", () => {
    test.use({ storageState: "tests/.auth/facilityAdmin.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      // Verify Edit button is visible on accounts list
      await expect(
        page.getByRole("heading", { name: /accounts/i }),
      ).toBeVisible();

      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("admin", () => {
    test.use({ storageState: "tests/.auth/user.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /accounts/i }),
      ).toBeVisible();

      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("nurse", () => {
    test.use({ storageState: "tests/.auth/nurse.json" });

    test("cannot edit or rebalance accounts", async ({ page }) => {
      // Navigate to account detail page
      await page
        .getByRole("button", { name: /go to account/i })
        .first()
        .click();

      // Verify Edit button is not visible on account details
      const accountEditButton = page
        .getByRole("button", { name: /edit/i })
        .nth(0);
      await expect(accountEditButton).not.toBeVisible();

      // Verify Rebalance button is not visible
      const rebalanceButton = page.getByRole("button", { name: /rebalance/i });
      await expect(rebalanceButton).not.toBeVisible();
    });
  });
});
