import { expect, test, type Page } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Discharge Flow", () => {
  let encounterId: string | null = null;
  let wasDischargedInTest = false;

  const visibleBeforeDischarge = ["In Progress"];
  const hiddenBeforeDischarge = ["Discharged", "Unknown"];

  async function navigateToUpdateEncounter(page: Page) {
    const facilityId = getFacilityId();
    const patientId = getPatientId();

    // ✅ correct helper usage for your repo
    encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/`,
    );

    const updateLink = page.getByRole("link", {
      name: "Update Encounter",
    });

    await expect(updateLink).toBeVisible();
    await updateLink.click();
  }

  test.afterEach(async ({ request }) => {
    if (wasDischargedInTest && encounterId) {
      const response = await request.post(
        `/api/v1/encounter/${encounterId}/restart/`,
      );

      if (!response.ok()) {
        throw new Error(
          `Cleanup failed for encounter ${encounterId} - ${response.status()}`,
        );
      }
    }

    encounterId = null;
    wasDischargedInTest = false;
  });

  test("should not show DISCHARGED and UNKNOWN in dropdown before discharge", async ({
    page,
  }) => {
    await navigateToUpdateEncounter(page);

    const statusDropdown = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    await statusDropdown.click();

    for (const opt of visibleBeforeDischarge) {
      await expect(
        page.getByRole("option", { name: new RegExp(opt, "i") }),
      ).toBeVisible();
    }

    for (const opt of hiddenBeforeDischarge) {
      await expect(
        page.getByRole("option", { name: new RegExp(opt, "i") }),
      ).not.toBeVisible();
    }
  });

  test("should allow discharge only via Mark for Discharge button and lock status after", async ({
    page,
  }) => {
    await navigateToUpdateEncounter(page);

    const dischargeButton = page.getByRole("button", {
      name: /mark for discharge/i,
    });

    await expect(dischargeButton).toBeVisible();

    wasDischargedInTest = true;

    await dischargeButton.click();

    const statusDropdown = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    await expect(statusDropdown).toHaveText(/discharged/i);
    await expect(statusDropdown).toBeDisabled();

    await page.reload();

    const statusDropdownAfterReload = page.getByRole("combobox", {
      name: /encounter status/i,
    });

    await expect(statusDropdownAfterReload).toBeDisabled();
    await expect(statusDropdownAfterReload).toHaveText(/discharged/i);
  });
});
