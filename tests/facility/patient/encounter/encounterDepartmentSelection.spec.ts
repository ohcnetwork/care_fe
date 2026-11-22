import { expect, test } from "@playwright/test";
import {
  departmentCards,
  departmentTrigger,
  selectDepartment,
} from "tests/helper/departmentSelect";
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
    const cards = departmentCards(dialog);
    await expect(cards.filter({ hasText: department.name })).toHaveCount(1);

    // Reopening the picker keeps the default selected.
    await departmentTrigger(dialog).click();
    await expect(
      page
        .getByRole("checkbox", { name: department.name, exact: true })
        .first(),
    ).toBeChecked();
    await page.getByRole("button", { name: /^Done\b/ }).click();
    await expect(cards.filter({ hasText: department.name })).toHaveCount(1);

    if (preferred) {
      await cards
        .filter({ hasText: department.name })
        .getByRole("button", { name: `Remove ${department.name}`, exact: true })
        .click();
      // A preference is an initial default, not a command to re-add a removed row.
      await expect(cards).toHaveCount(0);
      await selectDepartment(page, dialog, alternative.name, {
        multiple: true,
      });
      await expect(cards.filter({ hasText: alternative.name })).toHaveCount(1);
      await expect(cards.filter({ hasText: department.name })).toHaveCount(0);
    }
    await dialog.getByRole("button", { name: /^Cancel\b/ }).click();
    await expect(dialog).toHaveCount(0);
  });
}
