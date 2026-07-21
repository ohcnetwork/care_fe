import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

const PAGE_SIZE = 12;
const DEPT_COUNT = PAGE_SIZE + 3; // 15 — enough to trigger pagination
// Per-run unique prefix avoids stale records from prior runs satisfying the
// count without being linked to the current test user.
const DEPT_PREFIX = `PaginationTest-${faker.string.alphanumeric(8)}`;

test.use({ storageState: "tests/.auth/user.json" });

/** Ensure at least DEPT_COUNT departments with the prefix exist, and link them to the first user. */
async function ensureDepartmentsAndLinkToUser(): Promise<{
  userId: string;
}> {
  const facilityId = getFacilityId();
  const apiUrl = getApiUrl();
  const headers = getApiHeaders();

  // --- ensure departments exist ---
  const listRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/?name=${DEPT_PREFIX}&limit=50`,
    { headers },
  );
  if (!listRes.ok) throw new Error(`Failed to list orgs: ${listRes.status}`);
  const listData = (await listRes.json()) as {
    count: number;
    results: Array<{ id: string; name: string }>;
  };

  const existing = listData.results;
  const toCreate = Math.max(0, DEPT_COUNT - existing.length);

  const created: Array<{ id: string; name: string }> = [];
  for (let i = 0; i < toCreate; i++) {
    const name = `${DEPT_PREFIX} ${faker.string.alphanumeric(6)}`;
    const res = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          description: "Test department for pagination",
          org_type: "dept",
          facility: facilityId,
        }),
      },
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to create dept: ${res.status} — ${txt}`);
    }
    const dept = (await res.json()) as { id: string; name: string };
    created.push(dept);
  }

  const allDepts = [...existing, ...created].slice(0, DEPT_COUNT);

  // --- pick the first user in the facility ---
  const usersRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/users/?limit=1`,
    { headers },
  );
  if (!usersRes.ok)
    throw new Error(`Failed to list users: ${usersRes.status}`);
  const usersData = (await usersRes.json()) as {
    results: Array<{ user: { id: string } }>;
  };
  if (!usersData.results.length) throw new Error("No users found in facility");
  const userId = usersData.results[0].user.id;

  // --- link each department to the user (best-effort; ignore 409 duplicates) ---
  for (const dept of allDepts) {
    // get already-linked users for this org
    const rolesRes = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/${dept.id}/users/`,
      { headers },
    );
    if (!rolesRes.ok) continue;
    const rolesData = (await rolesRes.json()) as {
      results: Array<{ user: { id: string }; role: { id: string } }>;
    };
    const alreadyLinked = rolesData.results.some(
      (r) => r.user.id === userId,
    );
    if (alreadyLinked) continue;

    // fetch a valid role id
    const roleListRes = await fetch(
      `${apiUrl}/api/v1/role/?limit=1`,
      { headers },
    );
    if (!roleListRes.ok) continue;
    const roleListData = (await roleListRes.json()) as {
      results: Array<{ id: string }>;
    };
    if (!roleListData.results.length) continue;
    const roleId = roleListData.results[0].id;

    const linkRes = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/${dept.id}/users/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ user: userId, role: roleId }),
      },
    );
    // 409 = already linked (race or duplicate); anything else is an unexpected failure
    if (!linkRes.ok && linkRes.status !== 409) {
      const txt = await linkRes.text();
      throw new Error(
        `Failed to link dept ${dept.id} to user ${userId}: ${linkRes.status} — ${txt}`,
      );
    }
  }

  return { userId };
}

test.describe("UserDepartmentsTab — search and pagination", () => {
  test.beforeAll(async () => {
    await ensureDepartmentsAndLinkToUser();
  });

  async function goToDepartmentsTab(page: import("@playwright/test").Page) {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users`);
    await expect(
      page.getByRole("button", { name: "See Details" }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "See Details" }).first().click();
    await page.waitForLoadState("networkidle");
    await page.getByText("Departments", { exact: true }).click();
    await page.waitForLoadState("networkidle");
  }

  /** Wait for the organizations API response that is specifically fetching departments for a user. */
  function waitForOrgsResponse(page: import("@playwright/test").Page) {
    return page.waitForResponse(
      (resp) =>
        resp.request().method() === "GET" &&
        resp.url().includes("/organizations/") &&
        resp.url().includes("containing_user=") &&
        resp.status() === 200,
    );
  }

  test("search input is visible above the department cards", async ({
    page,
  }) => {
    await goToDepartmentsTab(page);
    await expect(
      page.getByPlaceholder("Search by department/team name"),
    ).toBeVisible();
  });

  test("pagination controls appear when dept count exceeds page size", async ({
    page,
  }) => {
    await goToDepartmentsTab(page);
    // Scope to the pagination container (nav rendered inside useFilters Pagination)
    const pagination = page.locator("nav").filter({ has: page.locator("#page-2") });
    await expect(pagination).toBeVisible();
  });

  test("page 2 shows a different set of cards", async ({ page }) => {
    await goToDepartmentsTab(page);

    // collect page 1 names
    const cards1 = page.locator(".grid h3");
    await expect(cards1.first()).toBeVisible();
    const page1Names = await cards1.allTextContents();

    // navigate to page 2 using the stable id set by the Pagination component
    const responsePromise = waitForOrgsResponse(page);
    await page.locator("#page-2").click();
    await responsePromise;

    const cards2 = page.locator(".grid h3");
    await expect(cards2.first()).toBeVisible();
    const page2Names = await cards2.allTextContents();

    // pages must differ
    expect(page1Names).not.toEqual(page2Names);
  });

  test("each page shows at most 12 department cards", async ({ page }) => {
    await goToDepartmentsTab(page);
    const cards = page.locator(".grid h3");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeLessThanOrEqual(PAGE_SIZE);
  });

  test("typing a search substring filters cards to matching names", async ({
    page,
  }) => {
    await goToDepartmentsTab(page);

    const searchTerm = DEPT_PREFIX;
    const responsePromise = waitForOrgsResponse(page);
    await page
      .getByPlaceholder("Search by department/team name")
      .fill(searchTerm);
    await responsePromise;

    const cards = page.locator(".grid h3");
    await expect(cards.first()).toBeVisible();
    const names = await cards.allTextContents();
    for (const name of names) {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  });

  test("clearing search restores the full first-page list", async ({
    page,
  }) => {
    await goToDepartmentsTab(page);

    const input = page.getByPlaceholder("Search by department/team name");

    // collect baseline first-page names
    const cards = page.locator(".grid h3");
    await expect(cards.first()).toBeVisible();
    const baselineNames = await cards.allTextContents();

    // type a search and wait for the filtered response
    const searchResponse = waitForOrgsResponse(page);
    await input.fill(DEPT_PREFIX);
    await searchResponse;

    // clear it and wait for the restored response
    const clearResponse = waitForOrgsResponse(page);
    await input.fill("");
    await clearResponse;

    await expect(cards.first()).toBeVisible();
    const restoredNames = await cards.allTextContents();
    expect(restoredNames).toEqual(baselineNames);
  });

  test("no results message renders when search matches nothing", async ({
    page,
  }) => {
    await goToDepartmentsTab(page);

    const responsePromise = waitForOrgsResponse(page);
    await page
      .getByPlaceholder("Search by department/team name")
      .fill("zzz_no_match_xyz_999");
    await responsePromise;

    await expect(page.getByText("No departments found")).toBeVisible();
    // the pre-existing zero-departments state must NOT appear
    await expect(page.getByText("No departments assigned")).not.toBeVisible();
  });
});
