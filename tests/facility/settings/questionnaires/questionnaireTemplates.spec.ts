import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const TEMPLATE_PLACEHOLDER = 'Enter details or type "/" for templates';

test.describe("Questionnaire v2 text answer templates", () => {
  test("templates authored in the studio can be inserted while filling", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const questionTitle = `${faker.word.words(2)} Notes ${stamp}`;
    const templates = [
      { name: `Alpha ${stamp}`, content: "alpha content" },
      { name: `Beta ${stamp}`, content: "beta content" },
    ];

    await test.step("Create a questionnaire with a string question", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Templates ${stamp}`,
      });
      await addTopLevelQuestion(page, questionTitle);
      await page.getByRole("combobox", { name: "Question Type" }).click();
      await page.getByRole("option", { name: /^String/ }).click();
    });

    await test.step("Author two templates", async () => {
      for (const [index, template] of templates.entries()) {
        await page.getByRole("button", { name: "Add template" }).click();
        await page
          .getByRole("textbox", { name: "Template name" })
          .nth(index)
          .fill(template.name);
        await page
          .getByRole("textbox", { name: "Content" })
          .nth(index)
          .fill(template.content);
      }
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Typing / in the empty answer opens the template list", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      const answer = page.getByPlaceholder(TEMPLATE_PLACEHOLDER);
      await answer.click();
      await answer.press("/");

      const search = page.getByRole("combobox", { name: "Search template" });
      await expect(search).toBeVisible();
      // The slash opens the list instead of being typed into the answer.
      await expect(answer).toHaveValue("");

      await page.getByRole("option", { name: templates[0].name }).click();
      await expect(search).toBeHidden();
      await expect(answer).toHaveValue(templates[0].content);
      await expect(answer).toBeFocused();
    });

    await test.step("Inserting another template appends it after a space", async () => {
      await page.getByRole("button", { name: "Insert template" }).click();
      await page.getByRole("option", { name: templates[1].name }).click();
      await expect(page.getByPlaceholder(TEMPLATE_PLACEHOLDER)).toHaveValue(
        `${templates[0].content} ${templates[1].content}`,
      );
    });

    await test.step("Clicking the search box keeps typing in the search, not the answer", async () => {
      const answer = page.getByPlaceholder(TEMPLATE_PLACEHOLDER);
      await answer.fill("");
      await page.getByRole("button", { name: "Insert template" }).click();

      const search = page.getByRole("combobox", { name: "Search template" });
      await search.click();
      await page.keyboard.type("Beta");
      await expect(search).toHaveValue("Beta");
      await expect(answer).toHaveValue("");
      await expect(page.getByRole("option")).toHaveCount(1);

      await page.getByRole("option", { name: templates[1].name }).click();
      await expect(search).toBeHidden();
    });

    await test.step("Shift+Enter inserts the highlighted template and keeps the list open", async () => {
      const answer = page.getByPlaceholder(TEMPLATE_PLACEHOLDER);
      await answer.fill("");
      await page.getByRole("button", { name: "Insert template" }).click();

      const search = page.getByRole("combobox", { name: "Search template" });
      // Filter to one match each time: the list also highlights on hover, so
      // the initial highlight depends on where the pointer happens to be.
      await search.fill(templates[0].name);
      await search.press("Shift+Enter");
      await expect(search).toBeVisible();
      await expect(answer).toHaveValue(templates[0].content);

      await search.fill(templates[1].name);
      await search.press("Shift+Enter");
      await expect(search).toBeVisible();
      await expect(answer).toHaveValue(
        `${templates[0].content} ${templates[1].content}`,
      );

      // Plain Enter inserts and closes.
      await search.press("Enter");
      await expect(search).toBeHidden();
      await expect(answer).toHaveValue(
        `${templates[0].content} ${templates[1].content} ${templates[1].content}`,
      );
    });
  });

  test("text answers open the template list on a fresh line and insert there", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const templates = [
      { name: `Alpha ${stamp}`, content: "alpha content" },
      { name: `Beta ${stamp}`, content: "beta content" },
      { name: `Gamma ${stamp}`, content: "gamma content" },
    ];

    await test.step("Create a questionnaire with a text question and three templates", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Line Templates ${stamp}`,
      });
      await addTopLevelQuestion(page, `Notes ${stamp}`);
      await page.getByRole("combobox", { name: "Question Type" }).click();
      await page.getByRole("option", { name: /^Text/ }).click();

      for (const [index, template] of templates.entries()) {
        await page.getByRole("button", { name: "Add template" }).click();
        await page
          .getByRole("textbox", { name: "Template name" })
          .nth(index)
          .fill(template.name);
        await page
          .getByRole("textbox", { name: "Content" })
          .nth(index)
          .fill(template.content);
      }

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.getByRole("button", { name: "Preview" }).click();
    });

    const answer = page.getByPlaceholder(TEMPLATE_PLACEHOLDER);
    const search = page.getByRole("combobox", { name: "Search template" });
    const [alpha, beta, gamma] = templates;

    await test.step("A slash inside the text stays in the text", async () => {
      await answer.click();
      await answer.pressSequentially("and/or 12/05");
      await expect(answer).toHaveValue("and/or 12/05");
      await expect(search).toBeHidden();

      await answer.fill("first\nlast");
      await answer.focus();
      await answer.evaluate((element) => {
        (element as HTMLTextAreaElement).setSelectionRange(6, 6);
      });
      await answer.press("/");
      await expect(answer).toHaveValue("first\n/last");
      await expect(search).toBeHidden();
    });

    await test.step("Typing / on a fresh line opens the list and fills that line", async () => {
      await answer.fill("");
      await answer.press("/");
      await expect(search).toBeVisible();
      await page.getByRole("option", { name: alpha.name }).click();
      await expect(answer).toHaveValue(alpha.content);

      await answer.press("Enter");
      await answer.press("/");
      await expect(search).toBeVisible();
      await expect(answer).toHaveValue(`${alpha.content}\n`);
      await page.getByRole("option", { name: beta.name }).click();
      await expect(answer).toHaveValue(`${alpha.content}\n${beta.content}`);

      await answer.press("Enter");
      await answer.press("/");
      await search.fill(gamma.name);
      await search.press("Shift+Enter");
      await expect(search).toBeVisible();
      await search.fill(alpha.name);
      await search.press("Enter");
      await expect(search).toBeHidden();
      await expect(answer).toHaveValue(
        `${alpha.content}\n${beta.content}\n${gamma.content}\n${alpha.content}`,
      );
    });

    await test.step("The Insert template button adds a line without leaving a blank one", async () => {
      await answer.fill("note\n");
      await page.getByRole("button", { name: "Insert template" }).click();
      await page.getByRole("option", { name: alpha.name }).click();
      await expect(answer).toHaveValue(`note\n${alpha.content}`);
    });
  });

  test("a template without a name or content blocks saving until it is fixed", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Blank Template ${stamp}`,
    });
    await addTopLevelQuestion(page, `Notes ${stamp}`);
    await page.getByRole("combobox", { name: "Question Type" }).click();
    await page.getByRole("option", { name: /^String/ }).click();

    await page.getByRole("button", { name: "Add template" }).click();
    await page
      .getByRole("textbox", { name: "Template name" })
      .fill("Only name");

    await test.step("Saving is blocked while the content is empty", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(
        page,
        "Every template needs a name and content. Fill them in or remove the template.",
      );
    });

    await test.step("Saving works once the template is complete", async () => {
      await page
        .getByRole("textbox", { name: "Content" })
        .fill("Some template content");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });
  });

  test("changing the answer type away from text clears its templates", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Template Type ${stamp}`,
    });
    await addTopLevelQuestion(page, `Notes ${stamp}`);
    await page.getByRole("combobox", { name: "Question Type" }).click();
    await page.getByRole("option", { name: /^String/ }).click();

    await page.getByRole("button", { name: "Add template" }).click();
    await expect(
      page.getByRole("textbox", { name: "Template name" }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Question Type" }).click();
    await page.getByRole("option", { name: /^Choice/ }).click();
    await expect(
      page.getByRole("button", { name: "Add template" }),
    ).toHaveCount(0);

    await page.getByRole("combobox", { name: "Question Type" }).click();
    await page.getByRole("option", { name: /^String/ }).click();
    await expect(
      page.getByRole("textbox", { name: "Template name" }),
    ).toHaveCount(0);
  });
});
