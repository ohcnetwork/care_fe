import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** Imports a question tree into the freshly-opened builder via the file
 *  dropzone — much faster than authoring group scaffolding click-by-click. */
async function importQuestions(page: Page, questions: object[]): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ questions })),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

/** Selects a question in the builder tree nav. */
async function selectInNav(page: Page, text: string): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: text })
    .click();
}

/** The question editor card (scopes sub-question rows away from the nav). */
function editorCard(page: Page) {
  return page.locator('[data-slot="card"]');
}

test.describe("Questionnaire v2 builder groups", () => {
  test("sub-questions support bulk select, clear and bulk delete", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const [c1, c2, c3] = [
      `Child A ${stamp}`,
      `Child B ${stamp}`,
      `Child C ${stamp}`,
    ];

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Bulk ${stamp}`,
    });
    await importQuestions(page, [
      {
        text: `Group ${stamp}`,
        type: "group",
        link_id: "grp",
        questions: [
          { text: c1, type: "string", link_id: "c1" },
          { text: c2, type: "string", link_id: "c2" },
          { text: c3, type: "string", link_id: "c3" },
        ],
      },
    ]);

    await test.step("Checking two rows raises the bulk bar", async () => {
      await selectInNav(page, `Group ${stamp}`);
      await page.getByRole("checkbox", { name: c1 }).click();
      await page.getByRole("checkbox", { name: c2 }).click();
      await expect(page.getByText("2 sub-questions selected")).toBeVisible();
    });

    await test.step("Clear Selection dismisses the bar without deleting", async () => {
      await page.getByRole("button", { name: "Clear Selection" }).click();
      await expect(
        page.getByText("2 sub-questions selected"),
      ).not.toBeVisible();
      await expect(editorCard(page).getByText(c1)).toBeVisible();
    });

    await test.step("Bulk delete removes exactly the checked rows", async () => {
      await page.getByRole("checkbox", { name: c1 }).click();
      await page.getByRole("checkbox", { name: c2 }).click();
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(editorCard(page).getByText(c1)).not.toBeVisible();
      await expect(editorCard(page).getByText(c2)).not.toBeVisible();
      await expect(editorCard(page).getByText(c3)).toBeVisible();
    });
  });

  test("Move dialog relocates sub-questions to a sibling group and to top level", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const groupA = `Group Alpha ${stamp}`;
    const groupB = `Group Beta ${stamp}`;
    const a1 = `Question A1 ${stamp}`;
    const a2 = `Question A2 ${stamp}`;
    const b1 = `Question B1 ${stamp}`;
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Move ${stamp}`,
    });
    await importQuestions(page, [
      {
        text: groupA,
        type: "group",
        link_id: "grp-a",
        questions: [
          { text: a1, type: "string", link_id: "a1" },
          { text: a2, type: "string", link_id: "a2" },
        ],
      },
      {
        text: groupB,
        type: "group",
        link_id: "grp-b",
        questions: [{ text: b1, type: "string", link_id: "b1" }],
      },
    ]);

    await test.step("Move A1 into Group Beta at position 0", async () => {
      await selectInNav(page, groupA);
      await page.getByRole("checkbox", { name: a1 }).click();
      await page.getByRole("button", { name: "Move 1 question" }).click();

      const dialog = page.getByRole("dialog", { name: "Move 1 question" });
      await dialog.getByRole("combobox").click();
      await page.getByRole("option", { name: groupB }).click();
      await dialog.getByRole("spinbutton").fill("0");
      await dialog.getByRole("button", { name: "Move", exact: true }).click();
      await expect(dialog).not.toBeVisible();
    });

    await test.step("Group Beta now lists A1 first, then B1", async () => {
      await selectInNav(page, groupB);
      const rowTexts = editorCard(page).getByRole("button", {
        name: new RegExp(`Question (A1|B1) ${stamp}`),
      });
      await expect(rowTexts.first()).toHaveText(a1);
      await expect(rowTexts.last()).toHaveText(b1);
    });

    await test.step("Move A2 to the top level at position 0", async () => {
      await selectInNav(page, groupA);
      await page.getByRole("checkbox", { name: a2 }).click();
      await page.getByRole("button", { name: "Move 1 question" }).click();

      const dialog = page.getByRole("dialog", { name: "Move 1 question" });
      await dialog.getByRole("combobox").click();
      await page.getByRole("option", { name: "Top Level" }).click();
      await dialog.getByRole("spinbutton").fill("0");
      await dialog.getByRole("button", { name: "Move", exact: true }).click();

      // A2 is now the first top-level question in the tree nav.
      await expect(nav.getByRole("button", { name: a2 })).toContainText("1.");
    });
  });

  test("layout preset applies a two-column grid in preview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const groupTitle = `Layout Group ${stamp}`;

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Layout ${stamp}`,
    });
    await importQuestions(page, [
      {
        text: groupTitle,
        type: "group",
        link_id: "grp",
        questions: [
          { text: `Left ${stamp}`, type: "string", link_id: "l" },
          { text: `Right ${stamp}`, type: "string", link_id: "r" },
        ],
      },
    ]);

    await test.step("Pick the Two columns preset", async () => {
      await selectInNav(page, groupTitle);
      const layoutSelect = editorCard(page)
        .getByRole("combobox")
        .filter({ hasText: "Single column" });
      await layoutSelect.click();
      await page.getByRole("option", { name: "Two columns" }).click();
      await expect(
        editorCard(page)
          .getByRole("combobox")
          .filter({ hasText: "Two columns" }),
      ).toBeVisible();
    });

    await test.step("Save and confirm the preset in preview", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(
        page.locator('fieldset[class*="grid-cols-2"]'),
      ).toBeVisible();
    });
  });

  test("group type change is blocked while sub-questions exist", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const groupTitle = `Guarded Group ${stamp}`;
    const childTitle = `Only Child ${stamp}`;
    const typePicker = page.getByRole("combobox").first();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 TypeGuard ${stamp}`,
    });
    await importQuestions(page, [
      {
        text: groupTitle,
        type: "group",
        link_id: "grp",
        questions: [{ text: childTitle, type: "string", link_id: "c" }],
      },
    ]);

    await test.step("Changing type away from Group is rejected", async () => {
      await selectInNav(page, groupTitle);
      await typePicker.click();
      await page
        .locator('[data-slot="command-item"][data-value="string"]')
        .click();
      await expectToast(
        page,
        "Remove sub-questions before changing this question's type",
      );
      await expect(typePicker).toContainText("Group");
    });

    await test.step("After deleting the child, the change goes through", async () => {
      // The child row's kebab is the second "More options" (first is the
      // editor header's own kebab).
      await editorCard(page)
        .getByRole("button", { name: "More options" })
        .last()
        .click();
      await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
      await expect(editorCard(page).getByText(childTitle)).not.toBeVisible();

      await typePicker.click();
      await page
        .locator('[data-slot="command-item"][data-value="string"]')
        .click();
      await expect(typePicker).toContainText("String");
    });
  });
});
