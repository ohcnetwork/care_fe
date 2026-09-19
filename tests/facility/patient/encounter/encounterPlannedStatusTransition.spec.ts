import { expect, test, type Page } from "@playwright/test";
import {
  getEncounterCreateDialog,
  openCalendarAndGetNextMonthButton,
  openCreateEncounterDialog,
  selectStatusInCreateDialog,
} from "tests/facility/patient/encounter/encounterFormHelpers";

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

async function expectPersistedCancellation(page: Page) {
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
  expect(encounter.status).toBe("cancelled");
  expect(encounter.period.end ?? null).toBeNull();
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

  for (const start of ["past", "future"] as const) {
    test(`cancels a ${start}-starting encounter without an end date`, async ({
      page,
    }) => {
      await test.step("Create a planned encounter and open the update form", async () => {
        await createPlannedEncounter(page, start);
        await openEncounterUpdateForm(page);
      });

      await test.step("Cancel and verify the persisted period", async () => {
        await cancelEncounterFromCurrentForm(page);
        await expectPersistedCancellation(page);
      });
    });

    test(`clears the pending end date when a ${start}-starting encounter changes from Discontinued to Cancelled`, async ({
      page,
    }) => {
      await test.step("Select Discontinued before saving", async () => {
        await createPlannedEncounter(page, start);
        await openEncounterUpdateForm(page);
        await changeStatus(page, "Discontinued");
      });

      await test.step("Switch to Cancelled and verify the persisted period", async () => {
        await cancelEncounterFromCurrentForm(page);
        await expectPersistedCancellation(page);
      });
    });
  }

  for (const status of ["In Progress", "On Hold", "Entered in error"]) {
    test(`allows a future Planned encounter to transition to ${status}`, async ({
      page,
    }) => {
      await test.step("Update the planned encounter", async () => {
        await createPlannedEncounter(page, "future");
        await openEncounterUpdateForm(page);
        await changeStatus(page, status);
        await submitQuestionnaire(page);
        await expectSubmissionSuccess(page);
      });

      if (status !== "Entered in error") {
        await test.step("Cleanup: cancel the live encounter", async () => {
          await openEncounterUpdateForm(page);
          await cancelEncounterFromCurrentForm(page);
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
        if (status === "Discharged") {
          await page
            .getByRole("button", { name: "Mark for discharge" })
            .click();
        } else {
          await changeStatus(page, status);
        }
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
