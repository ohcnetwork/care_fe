import { expect, test, type Page } from "@playwright/test";
import {
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
  pickValuesetFromAutocomplete,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { closeAnyOpenPopovers, expectToast } from "tests/helper/ui";
import {
  createFacilityOverride,
  deleteFacilityValueSetsBySlug,
  getInstanceValueSetIdBySlug,
  resolveSlugForFacility,
} from "tests/helper/valueSet";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const PARENT_SLUG = "system-ucum-units";
const PARENT_NAME = "UCUM Units";

/** Picks a question type by its cmdk data-value token. */
async function pickType(page: Page, type: string): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

/**
 * A slug-bound choice question resolves its value set per facility: the
 * facility's override of the slug wins over the instance set, and each
 * user can pick either from the search popover. The pick is saved as the
 * user's preference and survives reopening the popover.
 */
test.describe("Fill page: choosing between value-set variants", () => {
  test("the search popover lets the user switch the slug between the facility override and the instance set", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const overrideName = `UCUM facility ${stamp}`;
    const questionTitle = `Dose unit ${stamp}`;
    let questionnaireId = "";

    await deleteFacilityValueSetsBySlug(facilityId, PARENT_SLUG);
    await createFacilityOverride({
      facilityId,
      parentId: await getInstanceValueSetIdBySlug(PARENT_SLUG),
      parentSlug: PARENT_SLUG,
      name: overrideName,
    });

    try {
      await test.step("Author a choice question bound to the instance set by slug", async () => {
        const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
          basePath: `/facility/${facilityId}/settings/questionnaires`,
          title: `QV2 VS Preference ${stamp}`,
        });
        questionnaireId =
          detailUrl.match(/questionnaires\/([0-9a-f-]+)/)?.[1] ?? "";
        expect(questionnaireId).not.toBe("");

        await addTopLevelQuestion(page, questionTitle);
        await pickType(page, "choice");
        await page.getByRole("radio", { name: "Value Set" }).click();
        await pickValuesetFromAutocomplete(page, {
          search: "UCUM",
          optionName: `${PARENT_NAME} (Instance)`,
        });
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expectToast(page, "Questionnaire updated successfully");
      });

      await page.goto(
        `/facility/${facilityId}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
      );
      const block = questionBlock(page, questionTitle);
      await expect(block).toHaveCount(1);

      const openPicker = async () => {
        await closeAnyOpenPopovers(page);
        await block.getByRole("combobox").click();
        const dialog = page.getByRole("dialog").last();
        const scope = (await dialog.isVisible().catch(() => false))
          ? dialog
          : page.locator("[data-radix-popper-content-wrapper]").last();
        await expect(scope.getByText(/^Using /)).toBeVisible();
        return scope;
      };

      const choose = async (
        scope: ReturnType<typeof page.locator>,
        optionName: string,
      ) => {
        await scope.getByRole("button", { name: "Change" }).click();
        await page
          .getByRole("listbox", { name: "Choose which value set to search" })
          .getByRole("option", { name: optionName })
          .click();
        await expectToast(page, "Value set preference saved");
      };

      await test.step("Pick the facility override; the popover and the backend both switch", async () => {
        const scope = await openPicker();
        await choose(scope, overrideName);
        await expect(scope.getByText(`Using ${overrideName}`)).toBeVisible();
        expect(
          (await resolveSlugForFacility(PARENT_SLUG, facilityId)).name,
        ).toBe(overrideName);
      });

      await test.step("Pick the instance set; the preference persists across reopen", async () => {
        const scope = await openPicker();
        await choose(scope, PARENT_NAME);
        await expect(scope.getByText(`Using ${PARENT_NAME}`)).toBeVisible();
        // Asserted server-side: reopening alone would only prove the
        // client's cache changed, and the toast from the previous pick can
        // still be on screen.
        expect(
          (await resolveSlugForFacility(PARENT_SLUG, facilityId)).name,
        ).toBe(PARENT_NAME);

        const reopened = await openPicker();
        await expect(reopened.getByText(`Using ${PARENT_NAME}`)).toBeVisible();
      });
    } finally {
      await deleteFacilityValueSetsBySlug(facilityId, PARENT_SLUG);
    }
  });
});
