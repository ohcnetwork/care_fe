import { expect, test, type Page } from "@playwright/test";
import {
  getEncounterCreateDialog,
  openCalendarAndGetNextMonthButton,
} from "tests/facility/patient/encounter/encounterFormHelpers";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function getPageActionsPalette(page: Page) {
  return page.getByRole("dialog", { name: "Search", exact: true });
}

async function openPageActionsPalette(page: Page) {
  await page.keyboard.press("Shift+?");
  await expect(page.getByPlaceholder("Search page actions")).toBeFocused();
  return getPageActionsPalette(page);
}

// Nothing here creates an encounter, so the shared patient is enough and
// openCreateEncounterDialog's fresh patient isn't needed.
async function openCreateEncounterSheet(page: Page) {
  await page.goto(`/facility/${getFacilityId()}/patient/${getPatientId()}`);
  await page.getByRole("link", { name: "Patient Home" }).first().click();
  await page.getByRole("button", { name: "Create Encounter" }).click();
  return getEncounterCreateDialog(page);
}

async function stubEncounterCreate(page: Page) {
  const createRequests: string[] = [];
  await page.route("**/api/v1/encounter/", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    createRequests.push(route.request().url());
    await route.fulfill({ status: 400, json: { detail: "Stubbed" } });
  });
  return createRequests;
}

// shortcutActionHandler drops a repeat of the same shortcut within 300ms of
// the last one, and a press that an overlay blocked still counts as the last.
const SHORTCUT_DEBOUNCE_MS = 300;

function getPageTime(page: Page) {
  return page.evaluate(() => Date.now());
}

// The debounce lives in a module-level map with nothing in the DOM to assert
// on, so wait it out on the page's own clock. Otherwise the next press would be
// swallowed by the debounce instead of judged on what covers the sheet.
async function waitOutShortcutDebounce(page: Page, lastPressAt: number) {
  await expect
    .poll(() => getPageTime(page), { intervals: [50] })
    .toBeGreaterThanOrEqual(lastPressAt + SHORTCUT_DEBOUNCE_MS);
}

test.describe("Shortcuts and overlays", () => {
  test.describe("Page actions palette on a page", () => {
    let encounterUrl: string;

    test.beforeEach(async ({ page }) => {
      encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/updates`;
      await page.goto(encounterUrl);
      await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    });

    test("runs the selected page action", async ({ page }) => {
      const palette = await openPageActionsPalette(page);

      await palette.getByRole("option", { name: /^Add Allergy/ }).click();

      await expect(page).toHaveURL(/questionnaire\/allergy_intolerance/);
      await expect(palette).toBeHidden();
    });

    test("keeps page shortcuts from firing behind it", async ({ page }) => {
      const palette = await openPageActionsPalette(page);

      // The search box would take the key as text, so move focus off it
      const actionList = palette.getByRole("listbox");
      await actionList.focus();
      await expect(actionList).toBeFocused();
      await page.keyboard.press("a");

      await page.keyboard.press("Escape");
      await expect(palette).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${encounterUrl}$`));
    });
  });

  test.describe("Sheet with an overlay on top", () => {
    test("Shift+Enter submits the sheet only when nothing covers it", async ({
      page,
    }) => {
      const createRequests = await stubEncounterCreate(page);
      const dialog = await openCreateEncounterSheet(page);
      await dialog.getByRole("button", { name: /^Ambulatory/ }).click();
      await expect(
        dialog.getByRole("button", { name: /^Create Encounter/ }),
      ).toBeEnabled();
      let lastShiftEnterAt = 0;

      await test.step("does not submit through the open calendar", async () => {
        const nextMonthButton = await openCalendarAndGetNextMonthButton(page);
        await nextMonthButton.focus();
        await page.keyboard.press("Shift+Enter");
        lastShiftEnterAt = await getPageTime(page);

        await page.keyboard.press("Escape");
        await expect(nextMonthButton).toBeHidden();
        expect(createRequests).toHaveLength(0);
      });

      await test.step("does not submit through an open dropdown", async () => {
        await dialog.getByRole("combobox", { name: "Status" }).click();
        const statusOption = page.getByRole("option").first();
        await statusOption.hover();
        // Off the options, focus sits on the popup and the key reaches the page
        await page.mouse.move(0, 0);

        // The blocked press above still started the debounce window
        await waitOutShortcutDebounce(page, lastShiftEnterAt);
        await page.keyboard.press("Shift+Enter");
        lastShiftEnterAt = await getPageTime(page);

        await page.keyboard.press("Escape");
        await expect(statusOption).toBeHidden();
      });

      await test.step("submits once nothing covers it", async () => {
        await waitOutShortcutDebounce(page, lastShiftEnterAt);
        expect(createRequests).toHaveLength(0);

        await page.keyboard.press("Shift+Enter");
        await expect.poll(() => createRequests.length).toBe(1);
      });
    });

    test("palette lists only the actions the sheet can run", async ({
      page,
    }) => {
      const dialog = await openCreateEncounterSheet(page);
      await expect(dialog).toBeVisible();
      await expect(
        page.locator('[data-shortcut-id="schedule-appointment"]'),
      ).toBeAttached();

      const palette = await openPageActionsPalette(page);
      const cancelAction = palette.getByRole("option", {
        name: /^Cancel Current Action/,
      });

      await expect(cancelAction).toBeVisible();
      await expect(
        palette.getByRole("option", { name: /^Schedule Appointment/ }),
      ).toHaveCount(0);

      await cancelAction.click();
      await expect(palette).toBeHidden();
      await expect(dialog).toBeHidden();
    });
  });
});
