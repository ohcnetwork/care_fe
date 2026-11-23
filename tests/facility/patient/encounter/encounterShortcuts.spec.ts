import { expect, test, type Page } from "@playwright/test";
import {
  dischargeDispositionCombobox,
  encounterStatusCombobox,
} from "tests/facility/patient/encounter/encounterFormHelpers";
import {
  createQuestionnaireEncounter,
  submitAndExpectSuccess,
} from "tests/helper/questionnaire";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function openNewEncounter(page: Page, encounterClass: "amb" | "imp") {
  const facilityId = getFacilityId();
  const { patientId, encounterId } = await createQuestionnaireEncounter(
    facilityId,
    { encounterClass },
  );
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
  );
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
        "aria-selected",
        "true",
      );

      await expect(page.getByText("Primary Parameters").first()).toBeVisible();
    });

    test("should navigate to Medications tab using 'g m' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("g");
      await page.keyboard.press("m");

      await expect(
        page.getByRole("tab", { name: "Medications" }),
      ).toHaveAttribute("aria-selected", "true");

      await expect(page.getByText("All Prescriptions").first()).toBeVisible();
    });

    test("should navigate to Notes tab using 'g n' shortcut", async ({
      page,
    }) => {
      await page.keyboard.press("g");
      await page.keyboard.press("n");

      await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
        "aria-selected",
        "true",
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
      await expect(
        page.getByRole("dialog", { name: "Search", exact: true }),
      ).toBeVisible();
    });

    test("should navigate back to Overview tab using 'g g' shortcut after switching tabs", async ({
      page,
    }) => {
      // First navigate to Notes tab
      await page.keyboard.press("g");
      await page.keyboard.press("n");
      await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      // Then navigate back to Overview using 'g g'
      await page.keyboard.press("g");
      await page.keyboard.press("g");
      await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});

test.describe("Mark as Completed Shortcut ('m c')", () => {
  test("should complete a non-inpatient encounter", async ({ page }) => {
    await openNewEncounter(page, "amb");

    await markEncounterAsComplete(page);
  });

  test("should navigate to update encounter page with Discharged status for an Inpatient encounter", async ({
    page,
  }) => {
    await openNewEncounter(page, "imp");

    await page.keyboard.press("m");
    await page.keyboard.press("c");

    await expect(page).toHaveURL(/questionnaire\/encounter\?toDischarge=true/);
    await expect(encounterStatusCombobox(page)).toHaveText("Discharged");

    const encounterId = page.url().match(/\/encounter\/([^/]+)/)?.[1];
    expect(encounterId).toBeTruthy();
    // The shortcut acts on the encounter that the overview refetches after the
    // discharge. Other "Discharged" text can render before that refetch returns.
    const dischargedEncounter = page.waitForResponse(
      async (response) =>
        new URL(response.url()).pathname ===
          `/api/v1/encounter/${encounterId}/` &&
        response.request().method() === "GET" &&
        (await response.json()).status === "discharged",
    );

    await dischargeDispositionCombobox(page).click();
    await page.getByRole("option", { name: "Home", exact: true }).click();
    await submitAndExpectSuccess(page);
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await dischargedEncounter;

    await expect(
      page.getByText("Discharged", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByText("Discharge Disposition:", { exact: true })
        .filter({ visible: true })
        .locator(".."),
    ).toContainText("Home");

    const response = await page.request.get(
      `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
      { headers: getApiHeaders() },
    );
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).status).toBe("discharged");

    await markEncounterAsComplete(page);
  });
});
