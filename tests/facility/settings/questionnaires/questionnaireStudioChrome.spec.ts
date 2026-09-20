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
  test("nested canvas questions select the exact leaf and persist inspector edits", async ({
    page,
  }) => {
    const stamp = Date.now();
    const outerTitle = `Outer group ${stamp}`;
    const innerTitle = `Inner group ${stamp}`;
    const deepTitle = `Deep group ${stamp}`;
    const leafTitles = [`Nested leaf ${stamp}`, `Deep leaf ${stamp}`];
    const editedTitles = leafTitles.map((title) => `${title} edited`);
    const canvas = page.getByRole("region", { name: "Form canvas" });
    const nav = page.getByRole("navigation");
    const titleInput = page.getByRole("textbox", {
      name: "Question Title",
      exact: true,
    });
    const leafBlock = (title: string) =>
      canvas
        .locator("[data-question-id]")
        .filter({ hasNot: page.locator("[data-question-id]") })
        .filter({
          has: page.getByText(title, { exact: true }),
        });
    const clickLeafBody = async (title: string) => {
      const answer = leafBlock(title).locator('input[id^="question-input-"]');
      await answer.scrollIntoViewIfNeeded();
      const bounds = await answer.boundingBox();
      expect(bounds).not.toBeNull();
      // The answer is intentionally inert in edit mode. A real pointer
      // click on its body must select this leaf, not an enclosing group.
      await page.mouse.click(
        bounds!.x + bounds!.width / 2,
        bounds!.y + bounds!.height / 2,
      );
      await expect(titleInput).toHaveValue(title);
      await expect(titleInput).toBeFocused();
      await expect(
        leafBlock(title).locator("..").getByText("Editing", { exact: true }),
      ).toBeVisible();
    };

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${getFacilityId()}/settings/questionnaires`,
      title: `QV2 Nested Selection ${stamp}`,
    });

    await test.step("Import leaves inside two and three nested groups", async () => {
      await page.getByRole("button", { name: "Import Questions" }).click();
      await page.locator('input[type="file"]').setInputFiles({
        name: "nested-groups.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            questions: [
              {
                text: outerTitle,
                type: "group",
                link_id: "outer",
                questions: [
                  {
                    text: innerTitle,
                    type: "group",
                    link_id: "inner",
                    styling_metadata: { containerClasses: "grid grid-cols-1" },
                    questions: [
                      {
                        text: leafTitles[0],
                        type: "string",
                        link_id: "nested_leaf",
                      },
                      {
                        text: deepTitle,
                        type: "group",
                        link_id: "deep",
                        styling_metadata: {
                          containerClasses: "grid grid-cols-1",
                        },
                        questions: [
                          {
                            text: leafTitles[1],
                            type: "string",
                            link_id: "deep_leaf",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      });
      await page.getByRole("button", { name: "Import", exact: true }).click();
      await expectToast(page, "Questionnaire Imported Successfully");
    });

    await test.step("Each nested leaf's body selects its own inspector", async () => {
      for (const title of leafTitles) {
        await nav.getByRole("button", { name: outerTitle }).click();
        await expect(titleInput).toHaveValue(outerTitle);
        await clickLeafBody(title);
      }
    });

    await test.step("Each plain leaf label selects its inspector for title editing", async () => {
      for (const [index, title] of leafTitles.entries()) {
        await nav.getByRole("button", { name: outerTitle }).click();
        await leafBlock(title).getByText(title, { exact: true }).click();
        await expect(titleInput).toHaveValue(title);
        await expect(titleInput).toBeFocused();
        await expect(
          leafBlock(title).locator("..").getByText("Editing", { exact: true }),
        ).toBeVisible();
        await titleInput.fill(editedTitles[index]);
        await expect(titleInput).toHaveValue(editedTitles[index]);
        await expect(
          leafBlock(editedTitles[index]).getByText(editedTitles[index], {
            exact: true,
          }),
        ).toBeVisible();
      }
      await expect(
        canvas.getByRole("textbox", { name: /Edit question heading/ }),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Reload preserves the edits and both leaves remain selectable", async () => {
      await page.reload();
      for (const title of editedTitles) {
        await clickLeafBody(title);
      }
      for (const title of [outerTitle, innerTitle, deepTitle]) {
        await expect(
          canvas.getByRole("heading", { name: title }),
        ).toHaveAccessibleName(new RegExp(`${title}$`));
      }
    });
  });

  test("issues popover lists save blockers and click-to-fix selects the question", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Chrome ${stamp}`,
    });
    // The header controls sit underneath top-center notifications. Dismiss
    // notices through their normal control before testing the issues popover.
    await page.addLocatorHandler(
      page.locator('li[data-sonner-toast][data-removed="false"]').first(),
      async (notice) => {
        await notice.getByRole("button", { name: "Close toast" }).click();
      },
      { noWaitAfter: true },
    );

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
