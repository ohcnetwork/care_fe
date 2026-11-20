import { expect, test, type Page } from "@playwright/test";

import { selectQuestionnaireStatusTab } from "tests/helper/questionnaireV2";
import {
  filterSelectButton,
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";
import { getQuestionnaireId } from "tests/support/questionnaireId";

test.use({ storageState: "tests/.auth/user.json" });

// The questionnaire pages read their query strings with typed search schemas
// (`src/lib/router/search/admin.ts`). The admin and the facility settings
// routes of a page use the same schema: the list (`questionnaireListSearch`)
// and the questionnaire page (`questionnaireShowSearch`).

const subjectTypeFilter = (page: Page) =>
  filterSelectButton(page, /subject type/i);

test.describe("Questionnaire list search params", () => {
  const listPath = "/admin/questionnaires";

  test("writes the status to the URL and the API request", async ({ page }) => {
    await page.goto(listPath);
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/questionnaire/",
      (params) => params.get("status") === "draft",
    );
    await selectQuestionnaireStatusTab(page, "Draft");
    await request;

    await expect(page).toHaveURL(queryParam("status", "draft"));
    await expect(page.getByRole("radio", { name: "Draft" })).toBeChecked();
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/questionnaire/",
      (params) =>
        params.get("status") === "retired" &&
        params.get("subject_type") === "encounter",
    );
    await page.goto(
      withSearch(listPath, { status: "retired", subject_type: "encounter" }),
    );
    await request;

    await expect(page.getByRole("radio", { name: "Retired" })).toBeChecked();
    await expect(subjectTypeFilter(page)).toContainText(/encounter/i);
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/questionnaire/",
      (params) =>
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("subject_type"),
    );
    await page.goto(
      withSearch(listPath, {
        status: "bogus",
        subject_type: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    await expect(page).not.toHaveURL(/subject_type=/);
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });

  test("restores the status on the facility settings list", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const request = waitForApiList(
      page,
      "/questionnaire/",
      (params) =>
        params.get("status") === "draft" &&
        params.get("facility") === facilityId,
    );
    await page.goto(
      withSearch(`/facility/${facilityId}/settings/questionnaires`, {
        status: "draft",
      }),
    );
    await request;

    await expect(page.getByRole("radio", { name: "Draft" })).toBeChecked();
  });
});

test.describe("Questionnaire page search params", () => {
  const detailPath = () => `/admin/questionnaires/${getQuestionnaireId()}`;

  test("opens the tab of the URL", async ({ page }) => {
    await page.goto(withSearch(detailPath(), { tab: "versions" }));

    await expect(page.getByRole("tab", { name: "Versions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("opens the questions tab for an invalid tab", async ({ page }) => {
    await page.goto(withSearch(detailPath(), { tab: "bogus" }));

    await expect(page.getByRole("tab", { name: "Questions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

test.describe("Questionnaire studio search params", () => {
  const studioPath = () => `/admin/questionnaires/${getQuestionnaireId()}/edit`;

  test("removes the import flag and an invalid mode from the URL", async ({
    page,
  }) => {
    // The studio removes `import` from the URL and writes back the other
    // values. An invalid `mode` reads as `undefined` and must not come back.
    await page.goto(withSearch(studioPath(), { import: "1", mode: "bogus" }));

    await expect(page).not.toHaveURL(/import=/);
    await expect(page).not.toHaveURL(/mode=/);
    await expect(page).not.toHaveURL(/undefined/);
  });
});
