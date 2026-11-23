import { expect, test, type Page } from "@playwright/test";
import { addDays } from "date-fns";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { expectAndDismissToast, expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { EncounterRead } from "@/types/emr/encounter/encounter";

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
  // The encounter header's edit link opens the encounter update form.
  await page.getByRole("link", { name: "Edit encounter", exact: true }).click();
  await expect(encounterStatusCombobox(page)).toBeVisible();
}

async function changeStatus(page: Page, status: string) {
  await encounterStatusCombobox(page).click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

async function selectClosingStatus(page: Page, status: string) {
  if (status === "Discharged") {
    await page.getByRole("button", { name: "Mark for discharge" }).click();
    await page
      .locator('label[data-slot="label"]')
      .filter({ hasText: /^Discharge Disposition/ })
      .locator("..")
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: "Home", exact: true }).click();
  } else {
    await changeStatus(page, status);
  }
}

async function submitQuestionnaire(page: Page) {
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
}

// Closes the toast too: a test that saves the form again (the cleanup
// steps) must see that save's own toast, not this one.
async function expectSubmissionSuccess(page: Page) {
  await expectAndDismissToast(page, "Questionnaire submitted successfully");
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

  for (const [label, status] of [
    ["Discharged", "discharged"],
    ["Discontinued", "discontinued"],
  ]) {
    test(`${label} sets an end date for a past encounter`, async ({ page }) => {
      const closed =
        await test.step("Close an encounter with a valid period", async () => {
          await createPlannedEncounter(
            page,
            "past",
            label === "Discharged" ? "Inpatient" : "Ambulatory",
          );
          await openEncounterUpdateForm(page);
          await selectClosingStatus(page, label);
          await submitQuestionnaire(page);
          await expectSubmissionSuccess(page);
          return expectPersistedPeriod(page, status, true);
        });

      if (status === "discharged") {
        await test.step("Complete the discharged encounter without changing its end date", async () => {
          await page.getByRole("tab", { name: "Actions", exact: true }).click();
          // The page also renders an sr-only "Mark as Completed" button as
          // its keyboard-shortcut target; click the one in the Actions tab.
          await page
            .getByRole("tabpanel", { name: "Actions", exact: true })
            .getByRole("button", { name: "Mark as Completed" })
            .click();
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
        await createPlannedEncounter(
          page,
          "future",
          status === "Discharged" ? "Inpatient" : "Ambulatory",
        );
        await openEncounterUpdateForm(page);
        await selectClosingStatus(page, status);
        await submitQuestionnaire(page);
        await expectToast(page, "Failed to submit questionnaire");
        await expect(
          page.locator('[data-slot="alert"]').getByText(VALIDATION_ERROR_TEXT),
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
        await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
        await expect(encounterStatusCombobox(page)).toContainText("Planned");
        await cancelEncounterFromCurrentForm(page);
      });
    });
  }
});
