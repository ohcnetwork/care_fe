import { expect, test } from "@playwright/test";
import {
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * The studio's save-flow chrome: the issues popover, Discard, the Save
 * button's version chip and the outline search — affordances the redesign
 * introduced on top of the builder contracts.
 */
test.describe("Questionnaire v2 studio chrome", () => {
  test("issues popover lists save blockers and click-to-fix selects the question", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Chrome ${stamp}`,
    });

    await test.step("An untitled question surfaces as '1 to fix'", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await expect(
        page.getByRole("button", { name: "1 to fix" }),
      ).toBeVisible();
    });

    await test.step("The popover entry names the rule and selects the question", async () => {
      await addTopLevelQuestion(page, `Named ${stamp}`);
      await page.getByRole("button", { name: "1 to fix" }).click();
      await page
        .getByRole("button", { name: "Every question needs a title" })
        .click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue("");
    });

    await test.step("Fixing the issue restores 'Ready to save'", async () => {
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(`Fixed ${stamp}`);
      await expect(
        page.getByRole("button", { name: "to fix" }),
      ).not.toBeVisible();
      await expect(page.getByText("Ready to save")).toBeVisible();
    });
  });

  test("Discard restores the saved draft and the Save chip shows the next version", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const originalTitle = `Original ${stamp}`;
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const saveButton = page.getByRole("button", { name: "Save Changes" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Discard ${stamp}`,
    });
    await addTopLevelQuestion(page, originalTitle);

    await test.step("The Save chip shows the version the save will create", async () => {
      await expect(saveButton).toContainText("v2");
      await saveButton.click();
      await expectToast(page, "Questionnaire updated successfully");
      await expect(saveButton).toContainText("v3");
    });

    await test.step("Discard reverts unsaved edits and disables Save", async () => {
      await titleInput.fill(`Edited ${stamp}`);
      await expect(saveButton).toBeEnabled();
      await page.getByRole("button", { name: "Discard" }).click();
      await expect(titleInput).toHaveValue(originalTitle);
      await expect(saveButton).toBeDisabled();
    });
  });

  test("outline search filters rows and hides the insert separators", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Search ${stamp}`,
    });
    for (const title of [`Alpha ${stamp}`, `Beta ${stamp}`, `Gamma ${stamp}`]) {
      await addTopLevelQuestion(page, title);
    }

    const search = page.getByPlaceholder("Find a question…");
    const navAddButtons = nav.getByRole("button", { name: "Add new question" });

    await test.step("A query narrows the outline to matching rows", async () => {
      // Unfiltered: two insert separators (between 3 rows) + the footer.
      await expect(navAddButtons).toHaveCount(3);
      await search.fill("Beta");
      await expect(
        nav.getByRole("button", { name: `Beta ${stamp}` }),
      ).toBeVisible();
      await expect(
        nav.getByRole("button", { name: `Alpha ${stamp}` }),
      ).not.toBeVisible();
      // Insert separators are positional in the filtered list — they hide
      // while a filter is active so an insert can't land at the wrong
      // index; the footer add stays reachable.
      await expect(navAddButtons).toHaveCount(1);
    });

    await test.step("No matches shows the empty message but keeps the footer adds", async () => {
      await search.fill("zzz-no-match");
      await expect(
        page.getByText("No question matches that search."),
      ).toBeVisible();
      await expect(
        nav.getByRole("button", { name: "Add Section" }),
      ).toBeVisible();
    });

    await test.step("Clearing the query restores every row", async () => {
      await search.fill("");
      for (const title of [
        `Alpha ${stamp}`,
        `Beta ${stamp}`,
        `Gamma ${stamp}`,
      ]) {
        await expect(nav.getByRole("button", { name: title })).toBeVisible();
      }
    });
  });
});
