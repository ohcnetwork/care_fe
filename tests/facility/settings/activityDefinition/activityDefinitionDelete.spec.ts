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
  createdAD = await createActivityDefinition(page, facilityId, false, {
    status: "Active",
  });
});

test.describe("activity definition deletion", () => {
  test("should delete activity definition", async ({ page }) => {
    // Register response waiter BEFORE navigation to ensure we catch the API response
    const detailApiResponse = page.waitForResponse(
      (resp) =>
        resp
          .url()
          .includes(`/activity_definition/f-${facilityId}-${createdAD.slug}`) &&
        resp.request().method() === "GET" &&
        resp.ok(),
    );
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}`,
    );
    await detailApiResponse;

    await expect(
      page.getByRole("heading", { name: createdAD.title }),
    ).toBeVisible();

    const deleteButton = page.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

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

    const retiredApiResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/activity_definition/") &&
        resp.request().method() === "GET",
    );
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${createdAD.slug}`,
    );
    await retiredApiResponse;

    await expect(page.getByText(/retired/i)).toBeVisible();
  });
});
