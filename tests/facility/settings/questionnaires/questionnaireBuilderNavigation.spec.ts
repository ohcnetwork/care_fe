import { expect, test, type Page } from "@playwright/test";
import {
  createFacilityQuestionnaireViaApi,
  createQuestionnaireAndOpenBuilder,
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const BEHAVIOUR_FLAGS = ["Required", "Repeatable", "Read only"];
const CAPTURE_FLAGS = [
  "Component",
  "Collect Time",
  "Collect Performer",
  "Collect Method",
  "Collect Body Site",
];

/** Imports flat string questions into the freshly-opened builder. */
async function importStringQuestions(
  page: Page,
  titles: string[],
): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        questions: titles.map((text, index) => ({
          text,
          type: "string",
          link_id: `q-${index}`,
        })),
      }),
    ),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

test.describe("Questionnaire v2 builder navigation", () => {
  test("a new question starts as an untitled String with every flag off", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const flag = (name: string) =>
      page.getByRole("checkbox", { name, exact: true });

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Defaults ${stamp}`,
    });

    const expectDefaults = async () => {
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue("");
      await expect(page.getByRole("combobox").first()).toContainText("String");
      for (const name of BEHAVIOUR_FLAGS) {
        await expect(flag(name)).toHaveAttribute("aria-checked", "false");
      }
      await page.getByRole("tab", { name: "Coding" }).click();
      await expect(page.getByText("Code Verified")).toHaveCount(0);
      for (const name of CAPTURE_FLAGS) {
        await expect(flag(name)).toHaveAttribute("aria-checked", "false");
      }
      await page.getByRole("tab", { name: "Question" }).click();
    };

    await test.step("Add First Question", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await expectDefaults();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(`First ${stamp}`);
    });

    await test.step("Add new question from the outline", async () => {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: "Add new question" })
        .last()
        .click();
      await expectDefaults();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(`Second ${stamp}`);
    });

    await test.step("Saved questions keep the defaults", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      const { questions } = await getQuestionnaireViaApi(
        detailUrl.split("/").pop()!,
      );
      expect(questions).toHaveLength(2);
      for (const question of questions) {
        expect(question.type).toBe("string");
        for (const key of [
          "required",
          "repeats",
          "read_only",
          "is_component",
          "collect_time",
          "collect_performer",
          "collect_method",
          "collect_body_site",
        ]) {
          expect(question[key] ?? false, key).toBe(false);
        }
      }
    });
  });

  test("Duplicate copies every property under a new id and a (copy) title", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const title = `Source question ${stamp}`;
    const source = {
      id: crypto.randomUUID(),
      link_id: "source",
      text: title,
      type: "choice",
      description: `Helper ${stamp}`,
      required: true,
      repeats: true,
      collect_time: true,
      collect_performer: true,
      answer_option: [{ value: "Alpha" }, { value: "Beta" }],
    };
    const id = await createFacilityQuestionnaireViaApi(
      facilityId,
      `QV2 Duplicate ${stamp}`,
      [source],
    );

    await page.goto(
      `/facility/${facilityId}/settings/questionnaires/${id}/edit`,
    );

    await test.step("Duplicate from the canvas toolbar", async () => {
      await questionBlock(page, title).locator("label").click();
      await page.getByRole("button", { name: "Duplicate question" }).click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(`${title} (copy)`);
    });

    await test.step("The copy shows the source's settings in the inspector", async () => {
      await expect(
        page.getByRole("textbox", { name: /Helper text/ }),
      ).toHaveValue(source.description);
      for (const name of ["Required", "Repeatable"]) {
        await expect(
          page.getByRole("checkbox", { name, exact: true }),
        ).toHaveAttribute("aria-checked", "true");
      }
    });

    await test.step("After saving, the copy matches the source except id, link_id and title", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      const { questions } = await getQuestionnaireViaApi(id);
      expect(questions).toHaveLength(2);
      const [original, copy] = questions;
      expect(copy.id).not.toBe(original.id);
      expect(copy.link_id).not.toBe(original.link_id);
      expect(copy.text).toBe(`${title} (copy)`);
      for (const key of [
        "type",
        "description",
        "required",
        "repeats",
        "collect_time",
        "collect_performer",
        "answer_option",
      ]) {
        expect(copy[key], key).toEqual(original[key]);
      }
    });
  });

  test("canvas click selects a question; the floating toolbar reorders, duplicates and deletes", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`Q One ${stamp}`, `Q Two ${stamp}`, `Q Three ${stamp}`];
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Canvas ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Import lands on question 1", async () => {
      await expect(titleInput).toHaveValue(titles[0]);
    });

    await test.step("Clicking a question card on the canvas selects it", async () => {
      // The card's inputs are inert on the edit canvas — the click lands on
      // the selection chrome. Aim at the label, which is never inert.
      await questionBlock(page, titles[1]).locator("label").click();
      await expect(titleInput).toHaveValue(titles[1]);
    });

    await test.step("Move question up via the floating toolbar", async () => {
      await page.getByRole("button", { name: "Move question up" }).click();
      await expect(nav.getByRole("button", { name: titles[1] })).toContainText(
        "1.",
      );
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "2.",
      );
    });

    await test.step("Move question down restores the order", async () => {
      await page.getByRole("button", { name: "Move question down" }).click();
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "1.",
      );
    });

    await test.step("Duplicate creates a selected copy right after", async () => {
      await page.getByRole("button", { name: "Duplicate question" }).click();
      await expect(titleInput).toHaveValue(`${titles[1]} (copy)`);
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).toContainText("3.");
    });

    await test.step("The duplicate persists through save and reload", async () => {
      // Pins cloneSubtree's id/link_id regeneration server-side: a copy
      // reusing the source's ids would be rejected or collapse on save.
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.reload();
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).toContainText("3.");
    });

    await test.step("Delete removes the copy via the toolbar", async () => {
      await questionBlock(page, `${titles[1]} (copy)`).locator("label").click();
      await page.getByRole("button", { name: "Delete question" }).click();
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).not.toBeVisible();
    });
  });

  test("tree nav selects rows and the separator inserts a question between", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`First ${stamp}`, `Last ${stamp}`];
    const nav = page.getByRole("navigation");
    const titleInput = page.getByRole("textbox", { name: "Question Title" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 TreeNav ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Clicking a nav row selects that question", async () => {
      await nav.getByRole("button", { name: titles[1] }).click();
      await expect(titleInput).toHaveValue(titles[1]);
      await nav.getByRole("button", { name: titles[0] }).click();
      await expect(titleInput).toHaveValue(titles[0]);
    });

    await test.step("The separator + inserts an untitled question between", async () => {
      // Inside the nav, separator "+" buttons come before the footer link —
      // with two questions there is exactly one separator, and it is first.
      await nav
        .getByRole("button", { name: "Add new question" })
        .first()
        .click();
      await expect(titleInput).toHaveValue("");
      const inserted = nav.getByRole("button", { name: "Untitled Question" });
      await expect(inserted).toBeVisible();
      await expect(inserted).toContainText("2.");
      await expect(nav.getByRole("button", { name: titles[1] })).toContainText(
        "3.",
      );
    });
  });

  test("a top-level question deletes via the editor kebab", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`Keep me ${stamp}`, `Delete me ${stamp}`];
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Delete ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Delete the second question", async () => {
      await nav.getByRole("button", { name: titles[1] }).click();
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Delete question" }).click();
      await expect(
        nav.getByRole("button", { name: titles[1] }),
      ).not.toBeVisible();
    });

    await test.step("The survivor renumbers and the delete persists on save", async () => {
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "1.",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(titles[0]);
      await expect(
        nav.getByRole("button", { name: titles[1] }),
      ).not.toBeVisible();
    });
  });
});
