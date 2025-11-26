import { expect, test } from "@playwright/test";

import { createActivityDefinition } from "tests/facility/settings/activityDefinition/activityDefinition";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let createdAD: Awaited<ReturnType<typeof createActivityDefinition>>;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  createdAD = await createActivityDefinition(page, facilityId);
});

test.describe("activity definition deletion", () => {
  test("should delete activity definition", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}`,
    );

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

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}`,
    );

    await expect(page.getByText(/retired/i)).toBeVisible();
  });
});
