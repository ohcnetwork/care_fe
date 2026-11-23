import { expect, test } from "@playwright/test";
import { expectHistoryIndex } from "tests/helper/history";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Back from clinical history", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let patientPath: string;
  let encounterPath: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    patientPath = `/facility/${facilityId}/patient/${patientId}`;
    encounterPath = `${patientPath}/encounter/${encounterId}/updates`;
  });

  test("encounter back after clinical history returns to where the encounter was opened", async ({
    page,
  }) => {
    await test.step("Open the encounter from the patient's encounters", async () => {
      await page.goto(`${patientPath}/encounters`);
      await page
        .getByRole("link", { name: "View Encounter" })
        .and(page.locator(`[href*="/encounter/${encounterId}/"]`))
        .click();
      await expect(page).toHaveURL(encounterPath);
      await expectHistoryIndex(page, 1);
    });

    await test.step("Open clinical history and switch its tab", async () => {
      await page
        .getByRole("link", { name: "Clinical History", exact: true })
        .click();
      await expect(page).toHaveURL(/\/history\/responses\?sourceUrl=/);
      await page.getByRole("tab", { name: "Past Diagnoses" }).click();
      await expect(page).toHaveURL(/\/history\/diagnoses\?sourceUrl=/);
      await expectHistoryIndex(page, 3);
    });

    await test.step("Back goes to the encounter entry, past the tab entries", async () => {
      await page.getByRole("button", { name: "Back to Encounter" }).click();
      await expect(page).toHaveURL(encounterPath);
      await expectHistoryIndex(page, 1);
    });

    await test.step("Encounter back goes to the patient, not to clinical history", async () => {
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(`${patientPath}/encounters`);
      await expectHistoryIndex(page, 0);
    });

    await test.step("The pages left are still forward in history", async () => {
      await page.goForward();
      await expect(page).toHaveURL(encounterPath);
      await page.goForward();
      await expect(page).toHaveURL(/\/history\/responses\?sourceUrl=/);
    });
  });

  test("clinical history opened directly replaces itself with its source", async ({
    page,
  }) => {
    await page.goto(
      `${patientPath}/history/responses?${new URLSearchParams({ sourceUrl: encounterPath })}`,
    );
    await expectHistoryIndex(page, 0);

    await page.getByRole("button", { name: "Back to Encounter" }).click();
    await expect(page).toHaveURL(encounterPath);
    await expectHistoryIndex(page, 0);

    // The encounter has nothing behind it either: it replaces itself with
    // the patient instead of adding an entry the browser back returns from.
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(patientPath);
    await expectHistoryIndex(page, 0);
  });

  test("close on clinical history also goes back", async ({ page }) => {
    await page.goto(encounterPath);
    await page
      .getByRole("link", { name: "Clinical History", exact: true })
      .click();
    await expect(page).toHaveURL(/\/history\/responses\?sourceUrl=/);
    await expectHistoryIndex(page, 1);

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(encounterPath);
    await expectHistoryIndex(page, 0);
  });
});
