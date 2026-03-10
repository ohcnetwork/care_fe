import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const API_URL = process.env.REACT_CARE_API_URL || "http://localhost:9000";

const facilityId = getFacilityId();

test.describe("Encounter Restart Flow", () => {
  async function createEncounter(page: Page, status: string): Promise<string> {
    const patientId = getPatientId();

    const res = await page.request.post(
      `${API_URL}/api/v1/facility/${facilityId}/patient/${patientId}/encounter/`,
      {
        data: { status },
      },
    );

    expect(res.ok()).toBeTruthy();

    const data = await res.json();

    return data.id;
  }

  async function openEncounterForUpdate(page: Page, encounterId: string) {
    await page.goto(`/facility/${facilityId}/encounter/${encounterId}/`);

    const updateLink = page.getByRole("link", {
      name: /update encounter/i,
    });

    await expect(updateLink).toBeVisible();
    await updateLink.click();
  }

  test("should restart a completed encounter and redirect correctly", async ({
    page,
  }) => {
    const encounterId = await createEncounter(page, "completed");

    try {
      await openEncounterForUpdate(page, encounterId);

      const settingsButton = page.getByRole("button", {
        name: /settings/i,
      });

      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      const restartOption = page.getByRole("menuitem", {
        name: /restart encounter/i,
      });

      await expect(restartOption).toBeVisible();
      await restartOption.click();

      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/encounter restarted successfully/i),
      ).toBeVisible({ timeout: 10000 });

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/encounter/${encounterId}`),
      );

      const statusDropdown = page.getByRole("combobox", {
        name: /encounter status/i,
      });

      await expect(statusDropdown).toHaveText(/active/i);
      await expect(statusDropdown).toBeEnabled();

      await expect(
        page.getByRole("menuitem", {
          name: /restart encounter/i,
        }),
      ).toHaveCount(0);
    } finally {
      const res = await page.request.patch(
        `${API_URL}/api/v1/encounter/${encounterId}/`,
        {
          data: { status: "completed" },
        },
      );

      expect(res.ok()).toBeTruthy();
    }
  });

  test("should not show update encounter link for non-completed encounters", async ({
    page,
  }) => {
    const encounterId = await createEncounter(page, "in_progress");

    try {
      await page.goto(`/facility/${facilityId}/encounter/${encounterId}/`);

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/encounter/${encounterId}`),
      );

      await expect(
        page.getByRole("link", {
          name: /update encounter/i,
        }),
      ).toHaveCount(0);
    } finally {
      const res = await page.request.patch(
        `${API_URL}/api/v1/encounter/${encounterId}/`,
        {
          data: { status: "completed" },
        },
      );

      expect(res.ok()).toBeTruthy();
    }
  });
});
