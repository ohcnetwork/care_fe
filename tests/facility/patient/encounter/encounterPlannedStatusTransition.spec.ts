import { expect, test, type Page } from "@playwright/test";
import { addDays } from "date-fns";
import {
  changeEncounterStatusViaUi,
  completeEncounterFromActions,
  encounterStatusCombobox,
  openEncounterUpdateForm,
  saveEncounterUpdateForm,
  selectEncounterClosingStatus,
  selectEncounterStatus,
} from "tests/helper/encounter";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { expectAndDismissToast, expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { EncounterRead } from "../../../../src/types/emr/encounter/encounter";

test.use({ storageState: "tests/.auth/user.json" });

// Field-path prefixes may change while the core backend error stays the same.
const VALIDATION_ERROR_TEXT = "Start Date cannot be greater than End Date";

async function createPlannedEncounter(
  page: Page,
  start: "past" | "future",
  encounterClass: "Ambulatory" | "Inpatient" = "Ambulatory",
) {
  const facilityId = getFacilityId();
  const { patientId, encounterId } = await createQuestionnaireEncounter(
    facilityId,
    {
      status: "planned",
      encounterClass: encounterClass === "Inpatient" ? "imp" : "amb",
      start: addDays(new Date(), start === "future" ? 7 : -7),
    },
  );
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
  );
  return { facilityId, patientId, encounterId };
}

// Closes the toast too: a test that saves the form again (the cleanup
// steps) must see that save's own toast, not this one.
async function expectSubmissionSuccess(page: Page) {
  await expectAndDismissToast(page, "Questionnaire submitted successfully");
}

async function cancelEncounterFromCurrentForm(page: Page) {
  await selectEncounterStatus(page, "Cancelled");
  await saveEncounterUpdateForm(page);
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

  const response = await page.request.get(
    `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
    { headers: getApiHeaders() },
  );
  await expect(response).toBeOK();
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
        test(
          `${label} with a ${start} start ${pendingEnd ? "clears the pending end date" : "has no end date"}`,
          { tag: ["@atomic", "@cap:encounter.status.transition"] },
          async ({ page }) => {
            await test.step("Create a planned encounter and open the update form", async () => {
              await createPlannedEncounter(page, start);
              await openEncounterUpdateForm(page);
              if (pendingEnd) await selectEncounterStatus(page, "Discontinued");
            });

            await test.step(`Select ${label} and verify the persisted period`, async () => {
              await selectEncounterStatus(page, label);
              await saveEncounterUpdateForm(page);
              await expectSubmissionSuccess(page);
              await expectPersistedPeriod(page, status);
            });
          },
        );
      }
    }
  }

  for (const [label, status] of [
    ["Planned", "planned"],
    ["In Progress", "in_progress"],
    ["On Hold", "on_hold"],
  ]) {
    test(
      `${label} clears the pending end date of a future encounter`,
      { tag: ["@atomic", "@cap:encounter.status.transition"] },
      async ({ page }) => {
        const encounter =
          await test.step("Switch from Discontinued before saving", async () => {
            const created = await createPlannedEncounter(page, "future");
            await openEncounterUpdateForm(page);
            await selectEncounterStatus(page, "Discontinued");
            await selectEncounterStatus(page, label);
            await saveEncounterUpdateForm(page);
            await expectSubmissionSuccess(page);
            await expectPersistedPeriod(page, status);
            return created;
          });

        await test.step("Cleanup: cancel the live encounter", async () => {
          await changeEncounterStatusViaUi(page, {
            ...encounter,
            status: "Cancelled",
          });
        });
      },
    );
  }

  for (const [label, status] of [
    ["Discharged", "discharged"],
    ["Discontinued", "discontinued"],
  ]) {
    test(
      `${label} sets an end date for a past encounter`,
      { tag: ["@atomic", "@cap:encounter.status.transition"] },
      async ({ page }) => {
        const closed =
          await test.step("Close an encounter with a valid period", async () => {
            await createPlannedEncounter(
              page,
              "past",
              label === "Discharged" ? "Inpatient" : "Ambulatory",
            );
            await openEncounterUpdateForm(page);
            await selectEncounterClosingStatus(page, label);
            await saveEncounterUpdateForm(page);
            await expectSubmissionSuccess(page);
            return expectPersistedPeriod(page, status, true);
          });

        if (status === "discharged") {
          await test.step("Complete the discharged encounter without changing its end date", async () => {
            await completeEncounterFromActions(page);
            const completed = await expectPersistedPeriod(
              page,
              "completed",
              true,
            );
            expect(completed.period).toEqual(closed.period);
          });
        }
      },
    );
  }

  for (const status of ["Discharged", "Discontinued"]) {
    test(
      `blocks a future Planned encounter from transitioning to ${status} with a period error`,
      { tag: ["@atomic", "@cap:encounter.status.transition"] },
      async ({ page }) => {
        await test.step("Attempt a closing status with an invalid period", async () => {
          await createPlannedEncounter(
            page,
            "future",
            status === "Discharged" ? "Inpatient" : "Ambulatory",
          );
          await openEncounterUpdateForm(page);
          await selectEncounterClosingStatus(page, status);
          await saveEncounterUpdateForm(page);
          await expectToast(page, "Failed to submit questionnaire");
          await expect(
            page
              .locator('[data-slot="alert"]')
              .getByText(VALIDATION_ERROR_TEXT),
          ).toBeVisible();
        });

        await test.step("Cleanup: cancel the unchanged planned encounter", async () => {
          // Discharged disables the status picker. Reload the unchanged backend
          // state, then discard the failed attempt's local draft: saving is
          // blocked until a restored draft is resumed or discarded.
          await page.reload();
          await page
            .getByRole("button", { name: "Discard", exact: true })
            .click();
          await expect(page.getByText(/unsaved entry from/i)).toBeHidden();
          await expect(encounterStatusCombobox(page)).toContainText("Planned");
          await cancelEncounterFromCurrentForm(page);
        });
      },
    );
  }
});
