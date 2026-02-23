import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Discharge Flow", () => {
  let encounterId: string | null = null;

  async function navigateToUpdateEncounter(page: Page): Promise<string> {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    const viewLinks = page.getByRole("link", { name: "View Encounter" });

    await expect(viewLinks.first()).toBeVisible({
      timeout: 10_000,
    });

    // Deterministically select first encounter AFTER asserting visibility
    await viewLinks.first().click();

    // Capture encounterId from URL
    await expect(page).toHaveURL(/encounter\/([^/]+)\//);
    const url = page.url();
    const match = url.match(/encounter\/([^/]+)\//);
    if (!match) throw new Error("Encounter ID not found in URL");

    encounterId = match[1];

    await page.getByRole("link", { name: "Update Encounter" }).click();

    return encounterId;
  }

  test.afterEach(async ({ request }) => {
    // Restore encounter state if we mutated it
    if (encounterId) {
      await request.post(`/api/v1/encounter/${encounterId}/restart/`);
      encounterId = null;
    }
  });

  test("should not show DISCHARGED and UNKNOWN in dropdown before discharge", async ({
    page,
  }) => {
    await navigateToUpdateEncounter(page);

    const statusDropdown = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    await statusDropdown.click();

    // Positive assertion to ensure dropdown actually opened
    await expect(
      page.getByRole("option", { name: /in progress/i }),
    ).toBeVisible();

    // Forbidden options
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

    const statusDropdown = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    await expect(statusDropdown).toHaveText(/discharged/i);
    await expect(statusDropdown).toBeDisabled();

    // Reload and verify persistence
    await page.reload();

    await expect(statusDropdown).toHaveText(/discharged/i);
    await expect(statusDropdown).toBeDisabled();
  });
});
