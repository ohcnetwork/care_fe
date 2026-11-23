import { expect, test, type Page } from "@playwright/test";

import { selectedMultiFilterBar } from "tests/helper/multiFilter";
import { waitForApiList } from "tests/helper/searchParams";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The tabs of an account share its query string (`accountShowSearch`); each
// tab parses its own schema. The printed charge items have their own route.

test.describe("Account tabs search params", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  const accountUrl = (path: string, params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/account/${accountId}/${path}${search ? `?${search}` : ""}`;
  };

  const bedStatusTab = (page: Page, name: string) =>
    page
      .getByRole("tabpanel", { name: "Bed Charge Items" })
      .getByRole("tab", { name, exact: true });

  test("writes the bed charge item status to the URL", async ({ page }) => {
    await page.goto(accountUrl("bed_charge_items"));
    await expect(bedStatusTab(page, "All")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await bedStatusTab(page, "Billed").click();

    await expect(page).toHaveURL(/[?&]status=billed(&|$)/);
    await expect(bedStatusTab(page, "Billed")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the bed charge item status from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto(accountUrl("bed_charge_items", { status: "paid" }));

    await expect(bedStatusTab(page, "Paid")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the payments tab filter from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto(accountUrl("payments", { status: "cancelled" }));

    await expect(selectedMultiFilterBar(page, /payment status/i)).toContainText(
      /cancelled/i,
    );
    // The payments tab sorts by payment date when it opens, and keeps the
    // status.
    await expect(page).toHaveURL(/[?&]ordering=-payment_datetime(&|$)/);
    await expect(page).toHaveURL(/[?&]status=cancelled(&|$)/);
  });

  test("keeps the print order of charge items in the URL", async ({ page }) => {
    await page.goto(accountUrl("charge_items/print", { ordering: "title" }));
    const sortByTitle = page.getByRole("switch", { name: "Sort by Title" });

    await expect(sortByTitle).toBeChecked();

    await sortByTitle.click();

    await expect(sortByTitle).not.toBeChecked();
    await expect(page).not.toHaveURL(/ordering=/);
  });

  test("sends only the report filters of the query string to the reports API", async ({
    page,
  }) => {
    const request = waitForApiList(page, "/template_reports/");
    await page.goto(
      accountUrl("reports", {
        status: "draft",
        ordering: "title",
        is_archived: "true",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("associating_id")).toBe(accountId);
    expect(params.get("is_archived")).toBe("true");
    expect(params.has("status")).toBe(false);
    // The reports list keeps its own order (newest first).
    expect(params.get("ordering")).toBe("-created_date");
    await expect(page).toHaveURL(/[?&]status=draft(&|$)/);
  });

  test("lists the page of reports named in the query string", async ({
    page,
  }) => {
    // The reports list pages by 15, and sends the page as an offset.
    const request = waitForApiList(page, "/template_reports/");
    await page.goto(accountUrl("reports", { page: "2", limit: "15" }));
    const params = new URL((await request).url()).searchParams;

    expect(params.get("limit")).toBe("15");
    expect(params.get("offset")).toBe("15");
    expect(params.has("page")).toBe(false);
  });
});
