import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

// The organization pages read their query string with typed search schemas
// (`src/lib/router/search/organization.ts`; the referrals page uses
// `referralListSearch` from `referral.ts`).

/** Opens a government organization and returns its id. */
async function openGovernmentOrganization(page: Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Governance" }).click();
  await page
    .getByRole("link", { name: /Government$/ })
    .first()
    .click();
  await page.waitForURL(/\/organization\/[^/?]+/);
  return new URL(page.url()).pathname.split("/")[2];
}

/** The next GET request to `pathname` whose query matches `match`. */
const apiRequest = (
  page: Page,
  pathname: string,
  match: (params: URLSearchParams) => boolean = () => true,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === pathname &&
      match(url.searchParams)
    );
  });

const withQuery = (path: string, params: Record<string, string> = {}) => {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
};

test.describe("Organization users search params", () => {
  test("writes the username search to the URL and the request", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const usersPath = `/api/v1/organization/${organizationId}/users/`;
    await page.goto(`/organization/${organizationId}/users`);

    const request = apiRequest(
      page,
      usersPath,
      (params) => params.get("username") === "care",
    );
    await page.getByPlaceholder("Search by username").fill("care");
    await request;

    await expect(page).toHaveURL(/[?&]name=care(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
  });

  test("restores the username search from a bookmarked URL", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const request = apiRequest(
      page,
      `/api/v1/organization/${organizationId}/users/`,
      (params) => params.get("username") === "care",
    );
    await page.goto(
      withQuery(`/organization/${organizationId}/users`, { name: "care" }),
    );
    await request;

    await expect(page.getByPlaceholder("Search by username")).toHaveValue(
      "care",
    );
  });

  test("opens the add user sheet from the URL", async ({ page }) => {
    const organizationId = await openGovernmentOrganization(page);
    await page.goto(
      withQuery(`/organization/${organizationId}/users`, { sheet: "add" }),
    );

    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Add New User" }),
    ).toBeVisible();
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const organizationId = await openGovernmentOrganization(page);
    const usersPath = `/api/v1/organization/${organizationId}/users/`;

    await test.step("Lists users from the first page, with no sheet open", async () => {
      const request = apiRequest(page, usersPath);
      await page.goto(
        withQuery(`/organization/${organizationId}/users`, {
          page: "abc",
          sheet: "bogus",
        }),
      );
      const params = new URL((await request).url()).searchParams;

      expect(params.get("offset")).toBe("0");
      expect(params.get("page")).toBeNull();
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    await test.step("Drops the invalid values on the next search", async () => {
      await page.getByPlaceholder("Search by username").fill("care");

      await expect(page).toHaveURL(/[?&]name=care(&|$)/);
      await expect(page).toHaveURL(/[?&]page=1(&|$)/);
      await expect(page).not.toHaveURL(/sheet=|page=abc/);
    });
  });
});

test.describe("Organization pages search params", () => {
  test("restores the patient name search from a bookmarked URL", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const request = apiRequest(
      page,
      "/api/v1/patient/",
      (params) => params.get("name") === "zz",
    );
    await page.goto(
      withQuery(`/organization/${organizationId}/patients`, {
        name: "zz",
        page: "abc",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("page")).toBe("1");
    expect(params.get("offset")).toBe("0");
    await expect(page.getByPlaceholder("Search by patient name")).toHaveValue(
      "zz",
    );
  });

  test("restores the facility name search from a bookmarked URL", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const request = apiRequest(
      page,
      "/api/v1/facility/",
      (params) =>
        params.get("organization") === organizationId &&
        params.get("name") === "zz",
    );
    await page.goto(
      withQuery(`/organization/${organizationId}/facilities`, {
        name: "zz",
        page: "abc",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("offset")).toBe("0");
    await expect(page.getByPlaceholder("Search by facility name")).toHaveValue(
      "zz",
    );
  });

  test("restores the sub-organization search from a bookmarked URL", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const request = apiRequest(
      page,
      "/api/v1/organization/",
      (params) =>
        params.get("parent") === organizationId && params.get("name") === "zz",
    );
    await page.goto(
      withQuery(`/organization/${organizationId}`, {
        name: "zz",
        page: "abc",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("offset")).toBe("0");
    await expect(page.getByPlaceholder("Search by name")).toHaveValue("zz");
  });

  test("restores the referral status filter from a bookmarked URL", async ({
    page,
  }) => {
    const organizationId = await openGovernmentOrganization(page);
    const request = apiRequest(
      page,
      "/api/v1/referral/",
      (params) =>
        params.get("entity_id") === organizationId &&
        params.get("status") === "pending",
    );
    await page.goto(
      withQuery(`/organization/${organizationId}/referrals`, {
        referralStatus: "pending",
      }),
    );
    await request;

    await expect(page.getByRole("group", { name: /^Status$/ })).toContainText(
      "Pending",
    );
  });
});
