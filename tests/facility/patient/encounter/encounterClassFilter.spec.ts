import { expect, test } from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import {
  clearSelectedMultiFilter,
  openMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { createTestPatient } from "tests/helper/patient";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("All Encounters encounter class filter", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("filters the list by encounter class", async ({ page }) => {
    const encounterCards = page.locator('[data-cy="encounter-card"]');
    let patientId = "";

    await test.step("Create an ambulatory and a virtual encounter", async () => {
      // A dedicated patient keeps the list down to the encounters created here.
      patientId = await createTestPatient("Encounter Class Filter");
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      for (const encounterClass of ["amb", "vr"]) {
        await createTestEncounter(facilityId, patientId, {
          status: "completed",
          encounterClass,
          period: { start: yesterday, end: yesterday },
        });
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

    await test.step("The saved filter is restored without URL params", async () => {
      await page.goto(`/facility/${facilityId}/encounters/patients/all`);
      await expect(page).toHaveURL(
        (url) => url.searchParams.get("encounter_class") === "amb",
      );
      await expect(
        selectedMultiFilterBar(page, /^Encounter Class$/),
      ).toContainText("Ambulatory");
    });

    await test.step("Clearing the filter shows both encounters", async () => {
      await page.goto(
        `/facility/${facilityId}/encounters/patients/all?patient_filter=${patientId}&encounter_class=amb`,
      );
      await expect(encounterCards).toHaveCount(1);
      await clearSelectedMultiFilter(page, /^Encounter Class$/);
      await expect(page).not.toHaveURL(/encounter_class=/);
      await expect(encounterCards).toHaveCount(2);
    });

    await test.step("A cleared filter is not restored", async () => {
      await page.goto(`/facility/${facilityId}/encounters/patients/all`);
      // The default date range shows that saved filters were restored.
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.has("created_date_after") &&
          !url.searchParams.has("encounter_class"),
      );
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
