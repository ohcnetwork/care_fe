import { expect, test, type Page } from "@playwright/test";

import { waitForApiList, withSearch } from "tests/helper/searchParams";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The Generate Report dropdown (`GenerateReportDropdown`) searches templates
// server-side with its own state, apart from the query string of the page that
// hosts it.

/** Keys of the account page that the template API must not receive. */
const HOST_SEARCH = { status: "draft", name: "host-search", page: "2" };

const TEMPLATES = ["Alpha", "Beta"].map((name) => ({
  id: `e2e-template-${name.toLowerCase()}`,
  slug: `e2e-template-${name.toLowerCase()}`,
  slug_config: {},
  name: `E2E Template ${name}`,
  status: "active",
  default_format: "pdf",
  template_type: "account_report",
  context: "account",
  description: "",
  created_date: new Date().toISOString(),
}));

test.describe("Generate report dropdown search params", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  // Two templates, so that the dropdown (not the single-template button) shows.
  const mockTemplates = async (page: Page) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/template/"),
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        const name = new URL(route.request().url()).searchParams.get("name");
        const results = name
          ? TEMPLATES.filter((template) =>
              template.name.toLowerCase().includes(name.toLowerCase()),
            )
          : TEMPLATES;
        await route.fulfill({ json: { count: results.length, results } });
      },
    );
  };

  const openAccountReports = async (page: Page) => {
    const request = waitForApiList(page, "/template/");
    await page.goto(
      withSearch(
        `/facility/${facilityId}/billing/account/${accountId}/reports`,
        HOST_SEARCH,
      ),
    );
    return { request, hostSearch: new URL(page.url()).search };
  };

  test("sends none of the account page's query string to the template API", async ({
    page,
  }) => {
    await mockTemplates(page);
    const { request, hostSearch } = await openAccountReports(page);

    const params = new URL((await request).url()).searchParams;

    expect(params.get("template_type")).toBe("account_report");
    expect(params.get("status")).toBe("active");
    expect(params.has("name")).toBe(false);
    expect(params.has("page")).toBe(false);
    expect(new URL(page.url()).search).toBe(hostSearch);
  });

  test("searches the templates without changing the account page's URL", async ({
    page,
  }) => {
    await mockTemplates(page);
    const { hostSearch } = await openAccountReports(page);

    await page.getByRole("button", { name: "Generate Report" }).click();
    await expect(
      page.getByRole("menuitem", { name: "E2E Template Alpha" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "E2E Template Beta" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/template/",
      (params) => params.get("name") === "Beta",
    );
    await page.getByPlaceholder("Search templates").fill("Beta");
    await request;

    await expect(
      page.getByRole("menuitem", { name: "E2E Template Beta" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "E2E Template Alpha" }),
    ).toBeHidden();
    expect(new URL(page.url()).search).toBe(hostSearch);
  });
});
