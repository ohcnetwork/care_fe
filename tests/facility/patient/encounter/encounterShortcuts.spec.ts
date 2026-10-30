import { expect, test, type Page } from "@playwright/test";
import {
  dischargeDispositionCombobox,
  encounterStatusCombobox,
  getEncounterCreateDialog,
  openCreateEncounterDialog,
} from "tests/facility/patient/encounter/encounterFormHelpers";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function createEncounter(
  page: Page,
  encounterClass: "Ambulatory" | "Inpatient",
) {
  await openCreateEncounterDialog(page);
  const dialog = getEncounterCreateDialog(page);
  await dialog
    .getByRole("button", { name: new RegExp(`^${encounterClass}`) })
    .click();

  await Promise.all([
    page.waitForURL(/\/encounter\/[^/]+/),
    dialog.getByRole("button", { name: /^Create Encounter/ }).click(),
  ]);

  await expect(page.getByText("Encounter created successfully")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
}

async function markEncounterAsComplete(page: Page) {
  await page.keyboard.press("m");
  await page.keyboard.press("c");

  const dialog = page.getByRole("alertdialog", { name: "Mark as Complete" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByText("This action will close Appointment, Token and Encounter"),
  ).toBeVisible();

  await dialog.getByRole("button", { name: /^Mark as Complete/ }).click();
  await expect(
    page.getByText("Encounter Completed", { exact: true }),
  ).toBeVisible();
}

test.describe("Encounter Keyboard Shortcuts", () => {
  let encounterUrl: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    encounterUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`;

    await page.goto(encounterUrl);
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  });

  // --- Navigation Shortcuts (g + key sequences) ---

  test.describe("Tab Navigation Shortcuts", () => {
    test("should navigate to Plots tab using 'g p' shortcut", async ({
      page,
    }) => {
      // Press 'g' then 'p' for plots tab
      await page.keyboard.press("g");
      await page.keyboard.press("p");

      await expect(page.getByRole("tab", { name: "Plots" })).toHaveAttribute(
        "data-state",
        "active",
      );

      await expect(page.getByText("Primary Parameters").first()).toBeVisible();
    });

    test("should navigate to Medicines tab using 'g m' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("g");
      await page.keyboard.press("m");

      await expect(
        page.getByRole("tab", { name: "Medicines" }),
      ).toHaveAttribute("data-state", "active");

      await expect(page.getByText("All Prescriptions").first()).toBeVisible();
    });

    test("should navigate to Notes tab using 'g n' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("g");
      await page.keyboard.press("n");

      await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
        "data-state",
        "active",
      );

      await expect(page.getByText("Discussions").first()).toBeVisible();
    });
  });

  // --- Quick Action Shortcuts ---

  test.describe("Quick Action Shortcuts", () => {
    test("should open allergy form using 'a' shortcut", async ({ page }) => {
      await page.keyboard.press("a");

      // Should navigate to allergy questionnaire
      await expect(page).toHaveURL(/questionnaire\/allergy_intolerance/);
      await expect(page.getByText("Allergy Intolerance").first()).toBeVisible();
    });

    test("should open medication form using 'k' shortcut", async ({ page }) => {
      await page.keyboard.press("k");

      // Should navigate to medication request questionnaire
      await expect(page).toHaveURL(/questionnaire\/medication_request/);
      await expect(page.getByText("Medication Request").first()).toBeVisible();
    });

    test("should open service request form using 'r' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("r");

      // Should navigate to service request questionnaire
      await expect(page).toHaveURL(/questionnaire\/service_request/);
      await expect(page.getByText("Service Request").first()).toBeVisible();
    });
  });

  // --- Command Dialog and Other Encounter Shortcuts ---

  test.describe("Command Dialog and Other Shortcuts", () => {
    test("should open command dialog using 'Shift+E' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("Shift+E");

      // Command dialog should be visible
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should open keyboard shortcuts help using 'Shift+?' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("Shift+?");

      // Keyboard shortcuts dialog/panel should be visible
      await expect(page.getByText("Search").first()).toBeVisible();
    });

    test("should navigate back to Overview tab using 'g g' shortcut after switching tabs", async ({
      page,
    }) => {
      // First navigate to Notes tab
      await page.keyboard.press("g");
      await page.keyboard.press("n");
      await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
        "data-state",
        "active",
      );

      // Then navigate back to Overview using 'g g'
      await page.keyboard.press("g");
      await page.keyboard.press("g");
      await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });
});

test.describe("Mark as Completed Shortcut ('m c')", () => {
  test("should complete a non-inpatient encounter", async ({ page }) => {
    await createEncounter(page, "Ambulatory");

    await markEncounterAsComplete(page);
  });

  test("should navigate to update encounter page with Discharged status for an Inpatient encounter", async ({
    page,
  }) => {
    await createEncounter(page, "Inpatient");

    await page.keyboard.press("m");
    await page.keyboard.press("c");

    await expect(page).toHaveURL(/questionnaire\/encounter\?toDischarge=true/);
    await expect(encounterStatusCombobox(page)).toHaveText("Discharged");

    await dischargeDispositionCombobox(page).click();
    await page.getByRole("option", { name: "Home", exact: true }).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();

    await expect(page.getByText("Discharged").nth(1)).toBeVisible();

    const encounterId = page.url().match(/\/encounter\/([^/]+)/)?.[1];
    expect(encounterId).toBeTruthy();
    const response = await page.request.get(
      `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
      { headers: getApiHeaders() },
    );
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).status).toBe("discharged");

    await markEncounterAsComplete(page);
  });
});
