import { type APIRequestContext, expect, test } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import {
  clearSelectedMultiFilter,
  openMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { createTestPatient } from "tests/helper/patient";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function createCompletedEncounter(
  request: APIRequestContext,
  facilityId: string,
  patientId: string,
  encounterClass: string,
) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  for (let attempt = 0; ; attempt++) {
    const response = await request.post(`${getApiUrl()}/api/v1/encounter/`, {
      headers: getApiHeaders(),
      data: {
        patient: patientId,
        facility: facilityId,
        status: "completed",
        encounter_class: encounterClass,
        period: { start: yesterday, end: yesterday },
        priority: "routine",
        organizations: [],
      },
    });
    if (response.ok()) return;
    const error = await response.text();
    // The backend serializes encounter creation per facility with a lock
    // (the rejected create is rolled back), so retry only that rejection.
    if (
      attempt >= 4 ||
      response.status() !== 400 ||
      !error.includes("Encounter creation failed, try again after a while")
    ) {
      throw new Error(
        `Failed to create ${encounterClass} encounter: ${response.status()} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}

test.describe("All Encounters encounter class filter", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("filters the list by encounter class", async ({ page, request }) => {
    const encounterCards = page.locator("[data-status]");
    let patientId = "";

    await test.step("Create an ambulatory and a virtual encounter", async () => {
      // A dedicated patient keeps the list down to the encounters created here.
      patientId = await createTestPatient("Encounter Class Filter");
      for (const encounterClass of ["amb", "vr"]) {
        await createCompletedEncounter(
          request,
          facilityId,
          patientId,
          encounterClass,
        );
      }
    });

    await test.step("Both encounters show before filtering", async () => {
      await page.goto(
        `/facility/${facilityId}/encounters/patients/all?patient_filter=${patientId}`,
      );
      await expect(encounterCards).toHaveCount(2);
      await expect(
        encounterCards.filter({ hasText: "Ambulatory" }),
      ).toHaveCount(1);
      await expect(encounterCards.filter({ hasText: "Virtual" })).toHaveCount(
        1,
      );
    });

    await test.step("Selecting Ambulatory narrows the list", async () => {
      const filteredRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/encounter/" &&
          url.searchParams.get("patient_filter") === patientId &&
          url.searchParams.get("encounter_class") === "amb"
        );
      });
      await openMultiFilter(page, /^Encounter Class$/);
      await page
        .getByRole("menu")
        .getByText("Ambulatory", { exact: true })
        .click();
      await page.keyboard.press("Escape");
      await filteredRequest;

      await expect(page).toHaveURL(/encounter_class=amb/);
      await expect(encounterCards).toHaveCount(1);
      await expect(encounterCards).toContainText("Ambulatory");
    });

    await test.step("The filter survives a reload", async () => {
      await page.reload();
      await expect(
        selectedMultiFilterBar(page, /^Encounter Class$/),
      ).toContainText("Ambulatory");
      await expect(encounterCards).toHaveCount(1);
      await expect(encounterCards).toContainText("Ambulatory");
    });

    await test.step("Clearing the filter shows both encounters", async () => {
      await clearSelectedMultiFilter(page, /^Encounter Class$/);
      await expect(page).not.toHaveURL(/encounter_class=/);
      await expect(encounterCards).toHaveCount(2);
    });
  });

  test("is not offered on a class-specific encounter list", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/encounters/patients/imp`);
    await page.getByRole("button", { name: /^filter$/i }).click();
    await expect(
      page.getByRole("option", { name: /^Status/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: /^Encounter Class$/ }),
    ).toHaveCount(0);
  });
});
