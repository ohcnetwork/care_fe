import { expect, test, type Page } from "@playwright/test";
import {
  addTopLevelQuestion,
  createFacilityQuestionnaireViaApi,
  createQuestionnaireAndOpenBuilder,
  getQuestionnaireViaApi,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** The revision badge next to the questionnaire title in the top bar. */
function headerRevision(page: Page) {
  return page
    .getByRole("heading", { level: 1 })
    .locator("..")
    .getByText(/^v\d+$/);
}

async function saveChanges(page: Page) {
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expectToast(page, "Questionnaire updated successfully");
}

/** The metadata Title field (its label carries a required marker). */
function formTitleInput(page: Page) {
  return page.getByRole("textbox", { name: /^Title/ });
}

/** Records API writes, ignoring the app's background token refresh. */
function trackWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      request.method() !== "GET" &&
      url.includes("/api/") &&
      !url.includes("/auth/token/")
    ) {
      writes.push(`${request.method()} ${url}`);
    }
  });
  return writes;
}

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

    await test.step("Native canvas controls select nested questions with Enter and Space", async () => {
      for (const [index, title] of leafTitles.entries()) {
        await nav.getByRole("button", { name: outerTitle }).click();
        const select = canvas.getByRole("button", {
          name: `Select question: ${title}`,
          exact: true,
        });
        await select.focus();
        await expect(select).toBeFocused();
        await select.press(index === 0 ? "Enter" : "Space");
        await expect(titleInput).toHaveValue(title);
        await expect(select).toHaveAttribute("aria-pressed", "true");
        await expect(titleInput).toBeFocused();
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
    const formTitle = `QV2 Discard ${stamp}`;
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const saveButton = page.getByRole("button", { name: "Save Changes" });
    const nav = page.getByRole("navigation");

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: formTitle,
    });
    await addTopLevelQuestion(page, originalTitle);

    await test.step("The Save chip shows the version the save will create", async () => {
      await expect(saveButton).toContainText("v2");
      await saveButton.click();
      await expectToast(page, "Questionnaire updated successfully");
      await expect(saveButton).toContainText("v3");
    });

    await test.step("Discard reverts question and outline edits without a request", async () => {
      await titleInput.fill(`Edited ${stamp}`);
      await addTopLevelQuestion(page, `Unsaved ${stamp}`);
      await expect(saveButton).toBeEnabled();

      const writes = trackWrites(page);
      await page.getByRole("button", { name: "Discard" }).click();
      await expect(saveButton).toBeDisabled();
      await expect(
        nav.getByRole("button", { name: `Unsaved ${stamp}` }),
      ).toHaveCount(0);
      await nav.getByRole("button", { name: originalTitle }).click();
      await expect(titleInput).toHaveValue(originalTitle);
      expect(writes).toEqual([]);
    });

    await test.step("Discard creates no version: still v2 in the header and on the server", async () => {
      await expect(headerRevision(page)).toHaveText("v2");
      const saved = await getQuestionnaireViaApi(detailUrl.split("/").pop()!);
      expect(saved.internal_revision).toBe(2);
      expect(saved.title).toBe(formTitle);
      expect(saved.questions.map((q) => q.text)).toEqual([originalTitle]);
    });
  });

  test("Discard reverts Form Settings edits", async ({ page }) => {
    // Known bug: Discard leaves the unsaved Form Settings Title on screen;
    // with question edits also pending, Save stays enabled too.
    test.fail();
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const formTitle = `QV2 Discard Both ${stamp}`;
    const saveButton = page.getByRole("button", { name: "Save Changes" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: formTitle,
    });
    await addTopLevelQuestion(page, `Saved ${stamp}`);
    await saveChanges(page);

    await page
      .getByRole("textbox", { name: "Question Title" })
      .fill(`Edited ${stamp}`);
    await page.getByRole("button", { name: "Form Settings" }).click();
    await formTitleInput(page).fill(`Unsaved form ${stamp}`);
    await page.getByRole("button", { name: "Discard" }).click();

    await expect(formTitleInput(page)).toHaveValue(formTitle);
    await expect(saveButton).toBeDisabled();
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

  test("outline lists all 25 questions and a partial search lists every match", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const label = (n: number) => `Q${String(n).padStart(2, "0")} ${stamp}`;
    const titles = Array.from({ length: 25 }, (_, i) => label(i + 1));
    const id = await createFacilityQuestionnaireViaApi(
      facilityId,
      `QV2 Outline 25 ${stamp}`,
      titles.map((text, i) => ({
        id: crypto.randomUUID(),
        link_id: `q${i + 1}`,
        text,
        type: "string",
      })),
    );
    const nav = page.getByRole("navigation");
    const rows = nav.getByRole("button", {
      name: new RegExp(`Q\\d{2} ${stamp}`),
    });
    const search = page.getByPlaceholder("Find a question…");

    await page.goto(
      `/facility/${facilityId}/settings/questionnaires/${id}/edit`,
    );

    await test.step("Every question is listed and each row can be scrolled into view", async () => {
      await expect(nav.locator("..").getByText("25 questions")).toBeVisible();
      await expect(rows).toHaveCount(25);
      for (const title of titles) {
        const row = nav.getByRole("button", { name: title });
        await row.scrollIntoViewIfNeeded();
        await expect(row).toBeInViewport();
      }
    });

    await test.step("A partial query lists every match, and a match selects its question", async () => {
      await search.fill("Q1");
      await expect(rows).toHaveCount(10);
      for (let n = 10; n <= 19; n++) {
        await expect(nav.getByRole("button", { name: label(n) })).toBeVisible();
      }
      await nav.getByRole("button", { name: label(17) }).click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(label(17));
    });
  });

  test("every Save Changes with question edits creates the next version", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Save Versions ${stamp}`,
    });
    await expect(headerRevision(page)).toHaveText("v1");

    const edits = [
      () => addTopLevelQuestion(page, `First ${stamp}`),
      () =>
        page
          .getByRole("textbox", { name: "Question Title" })
          .fill(`First renamed ${stamp}`),
      () => addTopLevelQuestion(page, `Second ${stamp}`),
    ];
    for (const [index, edit] of edits.entries()) {
      const next = index + 2;
      await test.step(`Save ${index + 1} moves the header badge to v${next}`, async () => {
        await edit();
        // Consecutive saves stack their toasts, so wait on the badge instead.
        await page.getByRole("button", { name: "Save Changes" }).click();
        await expect(headerRevision(page)).toHaveText(`v${next}`);
      });
    }

    await test.step("The server holds v4", async () => {
      const saved = await getQuestionnaireViaApi(detailUrl.split("/").pop()!);
      expect(saved.internal_revision).toBe(4);
    });
  });

  test("Form Settings edits save with the questions and survive a reload", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const newTitle = `QV2 Settings Renamed ${stamp}`;
    const newSlug = `qv2-settings-${stamp}`;
    const description = `Studio description ${stamp}`;
    const settings = {
      title: formTitleInput(page),
      slug: page.getByRole("textbox", { name: "Slug" }),
      description: page.getByRole("textbox", { name: "Description" }),
      active: page
        .getByRole("radiogroup", { name: "Status" })
        .getByRole("radio", { name: "Active" }),
    };

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Settings ${stamp}`,
    });
    await addTopLevelQuestion(page, `Settings question ${stamp}`);

    await test.step("Form Settings shows the detail page's properties", async () => {
      await page.getByRole("button", { name: "Form Settings" }).click();
      await expect(
        page.getByRole("heading", { name: "Form Settings" }),
      ).toBeVisible();
      for (const field of Object.values(settings)) {
        await expect(field).toBeVisible();
      }
      await expect(page.getByText("Subject Type")).toBeVisible();
      await expect(
        page.locator("label").filter({ hasText: "Select Department" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Download JSON" }),
      ).toBeVisible();
    });

    await test.step("Edit title, slug, description and status, then save", async () => {
      await settings.title.fill(newTitle);
      await settings.slug.fill(newSlug);
      await settings.description.fill(description);
      await settings.active.click();
      await saveChanges(page);
      await expect(
        page.getByRole("heading", { level: 1, name: newTitle }),
      ).toBeVisible();
    });

    await test.step("A reload keeps every edited setting", async () => {
      await page.reload();
      await page.getByRole("button", { name: "Form Settings" }).click();
      await expect(settings.title).toHaveValue(newTitle);
      await expect(settings.slug).toHaveValue(newSlug);
      await expect(settings.description).toHaveValue(description);
      await expect(settings.active).toHaveAttribute("aria-checked", "true");
    });

    await test.step("The detail page shows the same values", async () => {
      await page.goto(detailUrl);
      await expect(settings.title).toHaveValue(newTitle);
      await expect(settings.slug).toHaveValue(newSlug);
      await expect(settings.description).toHaveValue(description);
      await expect(settings.active).toHaveAttribute("aria-checked", "true");
    });
  });

  test("browser Back from a directly opened edit URL returns to the previous page", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const listUrl = `/facility/${facilityId}/settings/questionnaires`;
    const id = await createFacilityQuestionnaireViaApi(
      facilityId,
      `QV2 Edit URL ${Date.now()}`,
      [
        {
          id: crypto.randomUUID(),
          link_id: "q1",
          text: "Only question",
          type: "string",
        },
      ],
    );
    const detailPath = `${listUrl}/${id}`;
    const saveButton = page.getByRole("button", { name: "Save Changes" });

    await test.step("Typing the edit URL opens the studio", async () => {
      await page.goto(listUrl);
      await page.goto(`${detailPath}/edit`);
      await expect(saveButton).toBeVisible();
      await expect(
        page.getByRole("navigation").getByRole("button", {
          name: "Only question",
        }),
      ).toBeVisible();
    });

    await test.step("Browser Back returns to the page before it", async () => {
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${listUrl}$`));
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`${detailPath}/edit$`));
      await expect(saveButton).toBeVisible();
    });
  });
});
