import { expect, test } from "@playwright/test";

import {
  filterSelectButton,
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { selectFromFilterSelect } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The patient identifier config list reads its query string with a typed
// search schema (`patientIdentifierConfigListSearch` in
// `src/lib/router/search/admin.ts`), on the admin and the facility settings
// routes. It opens with the active configs.

test.describe("Patient identifier config list search params", () => {
  const listPath = "/admin/patient_identifier_config";

  test("writes the status filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath);
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/patient_identifier_config/",
      (params) => params.get("status") === "inactive",
    );
    await selectFromFilterSelect(page, /status/i, "^inactive$");
    await request;

    await expect(page).toHaveURL(queryParam("status", "inactive"));
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/patient_identifier_config/",
      (params) => params.get("status") === "draft",
    );
    await page.goto(withSearch(listPath, { status: "draft" }));
    await request;

    await expect(filterSelectButton(page, /status\s*draft/i)).toBeVisible();
  });

  test("uses the active status in place of an invalid one", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/patient_identifier_config/",
      (params) =>
        params.get("facility") === facilityId &&
        params.get("status") === "active" &&
        params.get("offset") === "0",
    );
    await page.goto(
      withSearch(`/facility/${facilityId}/settings/patient_identifier_config`, {
        status: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    await expect(filterSelectButton(page, /status\s*active/i)).toBeVisible();
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
