import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { historyIndex, navigateInApp } from "tests/helper/history";
import { mockTestPlugin } from "tests/helper/testPlugin";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function sidebar(page: Page) {
  return page.locator('[data-sidebar="sidebar"]');
}

test.describe("Route layout flags and back navigation", () => {
  let facilityId: string;
  let patientUrl: string;
  let encounterUrl: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    patientUrl = `/facility/${facilityId}/patient/${getPatientId()}`;
    encounterUrl = `${patientUrl}/encounter/${getEncounterId()}`;
  });

  test(
    "full-screen legacy pages hide the sidebar and their neighbours keep it",
    { tag: ["@atomic", "@cap:nav.layout.view"] },
    async ({ page }) => {
      await page.goto(patientUrl);
      await expect(sidebar(page).first()).toBeVisible();

      await navigateInApp(page, `${encounterUrl}/updates`);
      await expect(page.locator('[data-shortcut-id="go-back"]')).toBeVisible();
      await expect(sidebar(page)).toHaveCount(0);

      // Questionnaire fill: a different full-screen route, same legacy layout.
      await navigateInApp(page, `${encounterUrl}/questionnaire`);
      await expect(page).toHaveURL(
        new RegExp(`${encounterUrl}/questionnaire$`),
      );
      await expect(sidebar(page)).toHaveCount(0);

      await navigateInApp(page, patientUrl);
      await expect(sidebar(page).first()).toBeVisible();
    },
  );

  test(
    "a plugin page under settings gets the settings workspace",
    { tag: ["@atomic", "@cap:nav.plugin.route"] },
    async ({ page }) => {
      await mockTestPlugin(page);

      await page.goto(`/facility/${facilityId}/settings/test-plugin`);
      await expect(
        page.locator('[data-cy="test-plugin-settings-page"]'),
      ).toHaveText(`Test plugin settings ${facilityId}`);
      await expect(
        page.locator('[data-cy="facility-settings-page-header"]'),
      ).toBeVisible();
    },
  );

  test(
    "encounter Back goes back past the encounter tabs as a browser back",
    { tag: ["@atomic", "@cap:nav.back.navigate"] },
    async ({ page }) => {
      await page.goto(patientUrl);
      await expect(sidebar(page).first()).toBeVisible();
      const startIndex = await historyIndex(page);

      await navigateInApp(page, `${encounterUrl}/updates`);
      await navigateInApp(page, `${encounterUrl}/files`);
      await expect(page).toHaveURL(new RegExp(`${encounterUrl}/files$`));

      await page.locator('[data-shortcut-id="go-back"]').click();

      await expect(page).toHaveURL(new RegExp(`${patientUrl}$`));
      expect(await historyIndex(page)).toBe(startIndex);

      // The encounter tabs are still forward history.
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`${encounterUrl}/updates$`));
    },
  );

  test(
    "encounter Back after a direct open goes to the patient",
    { tag: ["@atomic", "@cap:nav.back.navigate"] },
    async ({ page }) => {
      await page.goto(`${encounterUrl}/updates`);
      await page.locator('[data-shortcut-id="go-back"]').click();

      await expect(page).toHaveURL(new RegExp(`${patientUrl}$`));
      await expect(sidebar(page).first()).toBeVisible();
    },
  );

  test(
    "goBack after a direct open stays in the app",
    { tag: ["@atomic", "@cap:nav.back.navigate"] },
    async ({ page }) => {
      await page.goto(`/facility/${facilityId}/settings/devices/create`);
      const nameInput = page.getByRole("textbox", {
        name: "Registered Name *",
      });
      await expect(nameInput).toBeVisible();
      expect(await historyIndex(page)).toBe(0);

      await nameInput.fill(`Layout test ${faker.string.alphanumeric(8)}`);
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/settings/devices$`),
      );
      expect(await historyIndex(page)).toBe(0);
    },
  );
});
