import { expect, test } from "@playwright/test";
import { atPath, expectHistoryIndex } from "tests/helper/history";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const CASES = [
  {
    name: "specimen definition",
    list: "specimen_definitions",
    open: "Add Definition",
  },
  {
    name: "observation definition",
    list: "observation_definitions",
    open: "Add Definition",
  },
  {
    name: "healthcare service",
    list: "healthcare_services",
    open: "Add Healthcare Service",
  },
] as const;

test.describe("Cancel on facility settings forms", () => {
  for (const { name, list, open } of CASES) {
    test(`cancel on a new ${name} returns to the list it was opened from`, async ({
      page,
    }) => {
      const listPath = `/facility/${getFacilityId()}/settings/${list}`;
      await page.goto(listPath);
      await page.getByRole("button", { name: open, exact: true }).click();
      await expect(page).toHaveURL(`${listPath}/new`);
      await expectHistoryIndex(page, 1);

      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page).toHaveURL(atPath(listPath));
      await expectHistoryIndex(page, 0);

      await page.goForward();
      await expect(page).toHaveURL(`${listPath}/new`);
    });
  }
});
