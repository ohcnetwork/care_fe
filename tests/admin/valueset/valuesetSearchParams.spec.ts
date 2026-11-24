import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The value set list reads its query string with a typed search schema
// (`valueSetListSearch` in `src/lib/router/search/admin.ts`), on the admin
// and the facility settings routes.

test.describe("Value set list search params", () => {
  const listPath = "/admin/valuesets";

  test("writes the status tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath);
    await expect(
      page.getByRole("heading", { name: "ValueSets" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/valueset/",
      (params) => params.get("status") === "draft",
    );
    await page.getByRole("tab", { name: "Draft" }).click();
    await request;

    await expect(page).toHaveURL(queryParam("status", "draft"));
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const name = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/valueset/",
      (params) =>
        params.get("status") === "retired" && params.get("name") === name,
    );
    await page.goto(withSearch(listPath, { status: "retired", name }));
    await request;

    await expect(page.getByRole("tab", { name: "Retired" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("textbox", { name: "Search ValueSets" }),
    ).toHaveValue(name);
  });

  test("lists the active value sets for an invalid status", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/valueset/",
      (params) =>
        params.get("status") === "active" && params.get("offset") === "0",
    );
    await page.goto(withSearch(listPath, { status: "bogus", page: "abc" }));
    await request;

    await expect(page.getByRole("tab", { name: "Active" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });

  test("opens the catalogue of the URL in the facility settings", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const facilityPath = `/facility/${facilityId}/settings/valuesets`;

    await test.step("The shared catalogue", async () => {
      const request = waitForApiList(
        page,
        "/valueset/",
        (params) => params.get("auth_context") === "instance",
      );
      await page.goto(withSearch(facilityPath, { source: "instance" }));
      await request;

      await expect(
        page.getByRole("tab", { name: "Shared catalogue" }),
      ).toHaveAttribute("aria-selected", "true");
    });

    await test.step("An invalid catalogue opens the facility's", async () => {
      const request = waitForApiList(
        page,
        "/valueset/",
        (params) => params.get("facility") === facilityId,
      );
      await page.goto(withSearch(facilityPath, { source: "bogus" }));
      await request;

      await expect(
        page.getByRole("tab", { name: "This facility" }),
      ).toHaveAttribute("aria-selected", "true");
    });
  });
});
