import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 list (facility)", () => {
  test("facility questionnaires page loads with create action and status filter", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);
    await expect(
      page.getByRole("heading", { name: "Questionnaires" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Questionnaire" }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Status" }),
    ).toBeVisible();
  });
});
