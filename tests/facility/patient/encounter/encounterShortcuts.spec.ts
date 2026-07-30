import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

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
