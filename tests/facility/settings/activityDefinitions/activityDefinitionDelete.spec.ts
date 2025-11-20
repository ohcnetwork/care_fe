import { expect, test } from "@playwright/test";

import { createActivityDefinition } from "tests/helpers/activityDefinition";
import { clearFilter, expectToast } from "tests/helpers/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
const resourceCategoryName = "Lab Tests";
let createdAD: Awaited<ReturnType<typeof createActivityDefinition>>;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  createdAD = await createActivityDefinition(page, facilityId, {
    resourceCategoryName,
  });
});

test.describe("activity definition deletion", () => {
  test("should delete activity definition", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
    await page.getByText(resourceCategoryName).click();

    await clearFilter(page);

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(createdAD.title);

    const activityRow = page.locator("tr", { hasText: createdAD.title });
    await expect(activityRow).toBeVisible();
    await activityRow.getByRole("link", { name: /view/i }).click();

    await expect(
      page.getByRole("heading", { name: createdAD.title }),
    ).toBeVisible();

    await page.getByRole("button", { name: /delete/i }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/are you sure you want to delete/i),
    ).toBeVisible();

    await dialog.getByRole("button", { name: /confirm/i }).click();

    await expectToast(page, /definition deleted successfully/i);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions`,
    );

    await page.getByText(resourceCategoryName).click();

    await page
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-x") })
      .first()
      .click();

    await page.getByPlaceholder(/search/i).fill(createdAD.title);

    const retiredRow = page.locator("tr", { hasText: createdAD.title });
    await expect(retiredRow).toBeVisible();

    await expect(retiredRow.getByText(/retired/i)).toBeVisible();
  });
});
