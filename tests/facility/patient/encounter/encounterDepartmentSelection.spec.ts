import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import {
  getEncounterCreateDialog,
  openCreateEncounterDialog,
} from "./encounterFormHelpers";

test.use({ storageState: "tests/.auth/user.json" });

for (const preferred of [true, false]) {
  test(`encounter departments use ${preferred ? "preferred" : "sole available"} defaults and retain selection across list changes`, async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const department = {
      id: crypto.randomUUID(),
      name: `Department ${crypto.randomUUID()}`,
      description: "",
      org_type: "dept",
      active: true,
      has_children: false,
      level_cache: 0,
      permissions: [],
    };
    const alternative = {
      ...department,
      id: crypto.randomUUID(),
      name: `Alternative ${crypto.randomUUID()}`,
    };
    await page.route(
      `**/api/v1/facility/${facilityId}/organizations/**`,
      async (route) => {
        if (route.request().method() !== "GET") return route.abort();
        const url = new URL(route.request().url());
        const results = url.searchParams.has("favorite_list")
          ? preferred
            ? [department]
            : []
          : preferred
            ? [department, alternative]
            : [department];
        await route.fulfill({ json: { count: results.length, results } });
      },
    );

    await openCreateEncounterDialog(page);
    const dialog = getEncounterCreateDialog(page);
    await expect(
      dialog.getByText(department.name, { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("tab", { name: "All Organizations", exact: true })
      .click();
    await expect(
      dialog.getByText(department.name, { exact: true }),
    ).toHaveCount(1);
    await dialog
      .getByRole("tab", { name: "My Organizations", exact: true })
      .click();
    await expect(
      dialog.getByText(department.name, { exact: true }),
    ).toHaveCount(1);

    if (preferred) {
      await dialog
        .getByRole("button", { name: "Remove organization", exact: true })
        .click();
      await expect(
        dialog.getByText(department.name, { exact: true }),
      ).toHaveCount(0);
      await dialog
        .getByRole("tab", { name: "All Organizations", exact: true })
        .click();
      // A preference is an initial default, not a command to re-add a removed row.
      await expect(
        dialog.getByText(department.name, { exact: true }),
      ).toHaveCount(0);
      await dialog
        .getByRole("combobox")
        .filter({ hasText: "Select Department" })
        .click();
      await page
        .getByRole("option", { name: alternative.name, exact: true })
        .click();
      await expect(
        dialog.getByText(alternative.name, { exact: true }).first(),
      ).toBeVisible();
    }
    await dialog.getByRole("button", { name: /^Cancel\b/ }).click();
    await expect(dialog).toHaveCount(0);
  });
}
