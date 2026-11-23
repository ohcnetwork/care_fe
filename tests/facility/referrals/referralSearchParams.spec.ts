import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  openMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The referral list reads its filters with `referralListSearch`, and the
// referral pages read their context (`sourceUrl`) with
// `referralContextSearch` (`src/lib/router/search/referral.ts`).

/** The next referral list request whose query matches `match`. */
const referralListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/v1/referral/" &&
      match(url.searchParams)
    );
  });

async function selectReferralStatus(page: Page, status: string) {
  await openMultiFilter(page, /^Status\b/);
  await page.getByRole("menu").getByText(status, { exact: true }).click();
  await page.keyboard.press("Escape");
}

const statusFilterBar = (page: Page) =>
  selectedMultiFilterBar(page, /^Status$/);

test.describe("Facility referrals search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () => `/facility/${facilityId}/referrals`;
  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return search ? `${listPath()}?${search}` : listPath();
  };

  test("writes the status filter to the URL and the request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expect(
      page.getByRole("heading", { name: "Referrals", level: 1, exact: true }),
    ).toBeVisible();

    const request = referralListRequest(
      page,
      (params) =>
        params.get("entity_id") === facilityId &&
        params.get("status") === "completed",
    );
    await selectReferralStatus(page, "Completed");
    await request;

    await expect(page).toHaveURL(/[?&]referralStatus=completed(&|$)/);
    await expect(page).toHaveURL(/[?&]referralPage=1(&|$)/);
    await expect(statusFilterBar(page)).toContainText("Completed");
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = referralListRequest(
      page,
      (params) =>
        params.get("entity_id") === facilityId &&
        params.get("status") === "completed" &&
        params.get("assigned_to_me") === "true",
    );
    await page.goto(
      listUrl({ referralStatus: "completed", referralAssignedToMe: "true" }),
    );
    await request;

    await expect(statusFilterBar(page)).toContainText("Completed");
    await expect(
      selectedMultiFilterBar(page, /^Assigned to me$/),
    ).toContainText("Yes");
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const request = referralListRequest(
      page,
      (params) => params.get("entity_id") === facilityId,
    );
    await page.goto(
      listUrl({
        referralStatus: "bogus",
        referralAssignedToMe: "maybe",
        referralDestination: "bogus",
        referralPage: "abc",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("entity_type")).toBe("facility");
    expect(params.get("status")).toBeNull();
    expect(params.get("assigned_to_me")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(statusFilterBar(page)).toBeHidden();
    await expect(selectedMultiFilterBar(page, /^Assigned to me$/)).toBeHidden();
  });
});

test.describe("Referral page search params", () => {
  test("goes back to the page in sourceUrl", async ({ page }) => {
    const facilityId = getFacilityId();
    const sourceUrl = `/facility/${facilityId}/referrals?referralStatus=completed`;
    await page.goto(
      `/referrals/${faker.string.uuid()}?${new URLSearchParams({ sourceUrl })}`,
    );

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL(sourceUrl);
    await expect(statusFilterBar(page)).toContainText("Completed");
  });

  test("goes home when sourceUrl is on another origin", async ({ page }) => {
    await page.goto(
      `/referrals/${faker.string.uuid()}?${new URLSearchParams({
        sourceUrl: "https://example.com/facility",
      })}`,
    );

    await expect(
      page.getByRole("link", { name: "Back", exact: true }),
    ).toHaveAttribute("href", "/");
  });
});
