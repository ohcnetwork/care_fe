import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Discharge Flow", () => {
  async function navigateToUpdateEncounter(page) {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByText("View Encounter").first().click();
    await page.getByRole("link", { name: "Update Encounter" }).click();
  }

  test("should not show DISCHARGED and UNKNOWN in dropdown before discharge", async ({
    page,
  }) => {
    await navigateToUpdateEncounter(page);

    await page.getByLabel(/encounter status/i).click();

    await expect(
      page.getByRole("option", { name: /discharged/i }),
    ).not.toBeVisible();

    await expect(
      page.getByRole("option", { name: /unknown/i }),
    ).not.toBeVisible();
  });

  test("should allow discharge only via Mark for Discharge button and lock status after", async ({
    page,
  }) => {
    await navigateToUpdateEncounter(page);

    const dischargeButton = page.getByRole("button", {
      name: /mark for discharge/i,
    });

    await expect(dischargeButton).toBeVisible();

    await dischargeButton.click();

    // Status should now show DISCHARGED
    await expect(
      page.getByRole("combobox", { name: /encounter status/i }),
    ).toHaveText(/discharged/i);

    // Dropdown should be disabled
    await expect(
      page.getByRole("combobox", { name: /encounter status/i }),
    ).toBeDisabled();

    // Reload and verify persistence
    await page.reload();

    await expect(
      page.getByRole("combobox", { name: /encounter status/i }),
    ).toHaveText(/discharged/i);

    await expect(
      page.getByRole("combobox", { name: /encounter status/i }),
    ).toBeDisabled();
  });
});
