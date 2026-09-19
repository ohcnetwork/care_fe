import { expect, test, type Page } from "@playwright/test";
import {
  getEncounterCreateDialog,
  openCalendarAndGetNextMonthButton,
  openCreateEncounterDialog,
  selectStatusInCreateDialog,
} from "tests/facility/patient/encounter/encounterFormHelpers";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

import type { EncounterRead } from "@/types/emr/encounter/encounter";

test.use({ storageState: "tests/.auth/user.json" });

// Field-path prefixes may change while the core backend error stays the same.
const VALIDATION_ERROR_TEXT = "Start Date cannot be greater than End Date";

async function createPlannedEncounter(page: Page, start: "past" | "future") {
  await openCreateEncounterDialog(page);
  const dialog = getEncounterCreateDialog(page);
  await dialog.getByRole("button", { name: /^Ambulatory/ }).click();
  await selectStatusInCreateDialog(page, "Planned");
  await openCalendarAndGetNextMonthButton(page);
  await page
    .getByRole("button", {
      name: `Go to the ${start === "future" ? "Next" : "Previous"} Month`,
    })
    .click();
  await page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button")
    .click();

  await Promise.all([
    page.waitForURL(/\/encounter\/[^/]+/),
    dialog.getByRole("button", { name: /^Create Encounter/ }).click(),
  ]);
  await expect(
    page.getByRole("button", { name: "Encounter Actions" }),
  ).toBeVisible();
}

// The update form's label isn't associated with its SelectTrigger yet.
function encounterStatusCombobox(page: Page) {
  return page
    .locator('label[data-slot="label"]')
    .filter({ hasText: /^Encounter Status$/ })
    .locator("..")
    .getByRole("combobox");
}

async function openEncounterUpdateForm(page: Page) {
  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByRole("link", { name: "Update Encounter" }).click();
  await expect(encounterStatusCombobox(page)).toBeVisible();
}

async function changeStatus(page: Page, status: string) {
  await encounterStatusCombobox(page).click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

async function selectClosingStatus(page: Page, status: string) {
  if (status === "Discharged") {
    await page.getByRole("button", { name: "Mark for discharge" }).click();
  } else {
    await changeStatus(page, status);
  }
}

async function submitQuestionnaire(page: Page) {
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}

async function expectSubmissionSuccess(page: Page) {
  await expect(
    page.getByText("Questionnaire submitted successfully"),
  ).toBeVisible();
}

async function cancelEncounterFromCurrentForm(page: Page) {
  await changeStatus(page, "Cancelled");
  await submitQuestionnaire(page);
  await expectSubmissionSuccess(page);
}

async function expectPersistedPeriod(
  page: Page,
  status: string,
  hasEnd = false,
) {
  const encounterId = new URL(page.url()).pathname.match(
    /\/encounter\/([^/]+)/,
  )?.[1];
  expect(encounterId).toBeTruthy();

  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/v1/encounter/${encounterId}/` &&
        response.request().method() === "GET",
    ),
    page.reload(),
  ]);
  expect(response.ok()).toBeTruthy();
  const encounter: EncounterRead = await response.json();
  expect(encounter.status).toBe(status);
  if (hasEnd) {
    expect(encounter.period.end).toBeTruthy();
    const end = Date.parse(encounter.period.end!);
    expect(end).toBeGreaterThanOrEqual(Date.parse(encounter.period.start!));
    expect(end).toBeLessThanOrEqual(Date.now());
  } else {
    expect(encounter.period.end ?? null).toBeNull();
  }
  return encounter;
}

test.describe("Planned Encounter Status Transition", () => {
  // Tests share a patient with a limit of five live encounters.
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    try {
      await page.reload();
      if (!(await encounterStatusCombobox(page).isVisible())) {
        await openEncounterUpdateForm(page);
      }
      await cancelEncounterFromCurrentForm(page);
    } catch {
      // The encounter may already be terminal or creation may have failed.
    }
  });

  for (const [label, status] of [
    ["Cancelled", "cancelled"],
    ["Entered in error", "entered_in_error"],
  ]) {
    for (const start of ["past", "future"] as const) {
      for (const pendingEnd of [false, true]) {
        test(`${label} with a ${start} start ${pendingEnd ? "clears the pending end date" : "has no end date"}`, async ({
          page,
        }) => {
          await test.step("Create a planned encounter and open the update form", async () => {
            await createPlannedEncounter(page, start);
            await openEncounterUpdateForm(page);
            if (pendingEnd) await changeStatus(page, "Discontinued");
          });

          await test.step(`Select ${label} and verify the persisted period`, async () => {
            await changeStatus(page, label);
            await submitQuestionnaire(page);
            await expectSubmissionSuccess(page);
            await expectPersistedPeriod(page, status);
          });
        });
      }
    }
  }

  for (const [label, status] of [
    ["Planned", "planned"],
    ["In Progress", "in_progress"],
    ["On Hold", "on_hold"],
  ]) {
    test(`${label} clears the pending end date of a future encounter`, async ({
      page,
    }) => {
      await test.step("Switch from Discontinued before saving", async () => {
        await createPlannedEncounter(page, "future");
        await openEncounterUpdateForm(page);
        await changeStatus(page, "Discontinued");
        await changeStatus(page, label);
        await submitQuestionnaire(page);
        await expectSubmissionSuccess(page);
        await expectPersistedPeriod(page, status);
      });

      await test.step("Cleanup: cancel the live encounter", async () => {
        await openEncounterUpdateForm(page);
        await cancelEncounterFromCurrentForm(page);
      });
    });
  }

  for (const hasEnd of [false, true]) {
    test(`Unknown preserves ${hasEnd ? "an existing" : "an absent"} end date`, async ({
      page,
      request,
    }) => {
      await createPlannedEncounter(page, "past");
      const encounter = await expectPersistedPeriod(page, "planned");
      const url = `${getApiUrl()}/api/v1/encounter/${encounter.id}/`;
      const headers = getApiHeaders();
      const data = {
        status: "unknown",
        encounter_class: encounter.encounter_class,
        period: {
          start: encounter.period.start,
          end: hasEnd
            ? new Date(
                Date.parse(encounter.period.start!) + 3600000,
              ).toISOString()
            : undefined,
        },
        priority: encounter.priority,
        hospitalization: encounter.hospitalization,
        external_identifier: encounter.external_identifier,
        discharge_summary_advice: encounter.discharge_summary_advice,
      };

      try {
        // Unknown is nonselectable, so seed this valid existing state through the API.
        const response = await request.put(url, { headers, data });
        expect(response.ok()).toBeTruthy();
        const seeded: EncounterRead = await response.json();

        await test.step("Submit the unchanged Unknown encounter", async () => {
          await page.reload();
          await openEncounterUpdateForm(page);
          await expect(encounterStatusCombobox(page)).toContainText("Unknown");
          await submitQuestionnaire(page);
          await expectSubmissionSuccess(page);
          const saved = await expectPersistedPeriod(page, "unknown", hasEnd);
          expect(saved.period).toEqual(seeded.period);
        });
      } finally {
        const response = await request.put(url, {
          headers,
          data: {
            ...data,
            status: "cancelled",
            period: { start: encounter.period.start },
          },
        });
        expect(response.ok()).toBeTruthy();
      }
    });
  }

  for (const [label, status] of [
    ["Discharged", "discharged"],
    ["Discontinued", "discontinued"],
  ]) {
    test(`${label} sets an end date for a past encounter`, async ({ page }) => {
      const closed =
        await test.step("Close an encounter with a valid period", async () => {
          await createPlannedEncounter(page, "past");
          await openEncounterUpdateForm(page);
          await selectClosingStatus(page, label);
          await submitQuestionnaire(page);
          await expectSubmissionSuccess(page);
          return expectPersistedPeriod(page, status, true);
        });

      if (status === "discharged") {
        await test.step("Complete the discharged encounter without changing its end date", async () => {
          await page.getByRole("tab", { name: "Actions", exact: true }).click();
          await page.getByRole("button", { name: "Mark as Completed" }).click();
          await page
            .getByRole("alertdialog", { name: "Mark as Complete" })
            .getByRole("button", { name: /^Mark as Complete/ })
            .click();
          await expect(
            page.getByText("Encounter Completed", { exact: true }),
          ).toBeVisible();
          const completed = await expectPersistedPeriod(
            page,
            "completed",
            true,
          );
          expect(completed.period).toEqual(closed.period);
        });
      }
    });
  }

  for (const status of ["Discharged", "Discontinued"]) {
    test(`blocks a future Planned encounter from transitioning to ${status} with a period error`, async ({
      page,
    }) => {
      await test.step("Attempt a closing status with an invalid period", async () => {
        await createPlannedEncounter(page, "future");
        await openEncounterUpdateForm(page);
        await selectClosingStatus(page, status);
        await submitQuestionnaire(page);
        await expect(
          page.getByText("Failed to submit questionnaire"),
        ).toBeVisible();
        await expect(page.getByText(VALIDATION_ERROR_TEXT)).toBeVisible();
      });

      await test.step("Cleanup: cancel the unchanged planned encounter", async () => {
        // Discharged disables the status picker. Reload the unchanged backend state.
        await page.reload();
        await expect(encounterStatusCombobox(page)).toContainText("Planned");
        await cancelEncounterFromCurrentForm(page);
      });
    });
  }
});
