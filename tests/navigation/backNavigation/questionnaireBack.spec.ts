import { expect, test } from "@playwright/test";
import { atPath, expectHistoryIndex } from "tests/helper/history";
import { getQuestionnaireIdBySlug } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const LIST_PATH = "/admin/questionnaires";
const DETAIL_URL = /\/admin\/questionnaires\/[0-9a-f-]+$/;

test.describe("Back from questionnaire admin pages", () => {
  test("back and cancel on the create form return to the list", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    for (const control of ["Back", "Cancel"]) {
      await test.step(`${control} goes back to the list`, async () => {
        await page
          .getByRole("button", { name: "Create Questionnaire", exact: true })
          .click();
        await expect(page).toHaveURL(`${LIST_PATH}/new`);
        await expectHistoryIndex(page, 1);

        await page.getByRole("button", { name: control, exact: true }).click();
        await expect(page).toHaveURL(atPath(LIST_PATH));
        await expectHistoryIndex(page, 0);
      });
    }
  });

  test("a created questionnaire replaces the create form", async ({ page }) => {
    await page.goto(LIST_PATH);
    await page
      .getByRole("button", { name: "Create Questionnaire", exact: true })
      .click();
    await expect(page).toHaveURL(`${LIST_PATH}/new`);

    await page
      .getByRole("textbox", { name: "Title" })
      .pressSequentially(`Back navigation ${Date.now()}`);
    await page.getByRole("button", { name: "Save Questionnaire" }).click();
    await expectToast(page, "Questionnaire created successfully");
    await expect(page).toHaveURL(DETAIL_URL);
    await expectHistoryIndex(page, 1);

    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(atPath(LIST_PATH));
    await expectHistoryIndex(page, 0);
  });

  test("back from a revision returns to the versions tab", async ({ page }) => {
    const id = await getQuestionnaireIdBySlug("e2e-versioned");
    await page.goto(`${LIST_PATH}/${id}`);

    await test.step("The selected tab is kept in the URL, not in history", async () => {
      await page.getByRole("tab", { name: "Versions" }).click();
      await expect(page).toHaveURL(`${LIST_PATH}/${id}?tab=versions`);
      await expectHistoryIndex(page, 0);
    });

    await test.step("Back from a revision returns to the versions tab", async () => {
      await page
        .getByRole("tabpanel")
        .getByRole("button", { name: "Open" })
        .first()
        .click();
      await expect(page).toHaveURL(/\/versions\/[0-9a-f-]+$/);
      await expectHistoryIndex(page, 1);

      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(`${LIST_PATH}/${id}?tab=versions`);
      await expectHistoryIndex(page, 0);
      await expect(page.getByRole("tab", { name: "Versions" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});

test.describe("Leaving a form fill session", () => {
  test("closing a form replaces it with the encounter it lands on", async ({
    page,
  }) => {
    const encounterPath = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    await page.goto(`${encounterPath}/updates`);
    await page.getByRole("link", { name: "Add Allergy" }).click();
    await expect(page).toHaveURL(/\/questionnaire\/allergy_intolerance/);
    await expectHistoryIndex(page, 1);

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(`${encounterPath}/updates`);
    await expectHistoryIndex(page, 1);

    // The form is gone from history: going back cannot reopen it.
    await page.goBack();
    await expect(page).toHaveURL(`${encounterPath}/updates`);
    await expectHistoryIndex(page, 0);
  });
});
