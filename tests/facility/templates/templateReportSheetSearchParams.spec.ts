import { expect, test, type Page } from "@playwright/test";

import { waitForApiList, withSearch } from "tests/helper/searchParams";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The Generate Report sheet (`TemplateReportSheet`) keeps the filters of its
// template list in a `ScopedQueryParamsProvider`, apart from the query string
// of the page that hosts it.

/** `RESULTS_PER_PAGE_LIMIT`, the page size of the template list. */
const TEMPLATE_PAGE_SIZE = 14;

/** Keys of the account page that the template list also reads. */
const HOST_SEARCH = { status: "draft", name: "host-search", page: "2" };

test.describe("Template report sheet search params", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  const openAccountReports = async (page: Page) => {
    await page.goto(
      withSearch(
        `/facility/${facilityId}/billing/account/${accountId}/reports`,
        HOST_SEARCH,
      ),
    );
    const generateReport = page.getByRole("button", {
      name: "Generate Report",
    });
    await expect(generateReport).toBeVisible();
    return { generateReport, hostSearch: new URL(page.url()).search };
  };

  test("sends none of the account page's query string to the template API", async ({
    page,
  }) => {
    const { generateReport, hostSearch } = await openAccountReports(page);

    const request = waitForApiList(page, "/template/");
    await generateReport.click();
    const params = new URL((await request).url()).searchParams;

    expect(params.get("template_type")).toBe("account_report");
    expect(params.get("offset")).toBe("0");
    expect(params.has("status")).toBe(false);
    expect(params.has("name")).toBe(false);
    expect(new URL(page.url()).search).toBe(hostSearch);
  });

  test("pages through the templates without changing the account page's URL", async ({
    page,
  }) => {
    // Two pages of templates, so that the sheet shows its pagination.
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/template/"),
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        const offset = Number(
          new URL(route.request().url()).searchParams.get("offset") ?? 0,
        );
        await route.fulfill({
          json: {
            count: TEMPLATE_PAGE_SIZE * 2,
            results: Array.from({ length: TEMPLATE_PAGE_SIZE }, (_, i) => ({
              id: `e2e-template-${offset + i + 1}`,
              slug: `e2e-template-${offset + i + 1}`,
              slug_config: {},
              name: `E2E Template ${offset + i + 1}`,
              status: "active",
              default_format: "pdf",
              template_type: "account_report",
              context: "account",
              description: "",
              created_date: new Date().toISOString(),
            })),
          },
        });
      },
    );
    const { generateReport, hostSearch } = await openAccountReports(page);

    await generateReport.click();
    const sheet = page.getByRole("dialog", { name: "Available Templates" });
    await expect(
      sheet.getByText("E2E Template 1", { exact: true }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/template/",
      (params) => params.get("offset") === String(TEMPLATE_PAGE_SIZE),
    );
    await sheet.getByRole("button", { name: "Go to page 2" }).click();
    await request;

    await expect(
      sheet.getByText(`E2E Template ${TEMPLATE_PAGE_SIZE + 1}`, {
        exact: true,
      }),
    ).toBeVisible();
    expect(new URL(page.url()).search).toBe(hostSearch);
  });
});
