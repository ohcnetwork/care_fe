import { expect, test, type Page } from "@playwright/test";

import { selectedMultiFilterBar } from "tests/helper/multiFilter";
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
});
