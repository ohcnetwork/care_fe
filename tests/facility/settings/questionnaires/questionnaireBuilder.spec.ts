import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 builder", () => {
  test("add a question, save, and preview it", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Builder ${Date.now()}`;
    const questionTitle = faker.lorem.words(3);

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a question", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview renders the question", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      // Assert the CANVAS label specifically (the outline row also carries
      // the title — a bare .first() could pass on the outline alone).
      await expect(
        questionBlock(page, questionTitle).locator("label"),
      ).toBeVisible();
      await expect(page.getByPlaceholder("Enter details")).toBeVisible();
    });
  });

  test("bind an observation code from the valueset search", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Coding ${Date.now()}`;

    await test.step("Create a questionnaire with one question", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(faker.lorem.words(3));
    });

    const searchTrigger = page.getByRole("combobox", {
      name: "Search for observation codes",
    });

    await test.step("Open the Coding tab and the code search", async () => {
      await page.getByRole("tab", { name: "Coding" }).click();
      await expect(searchTrigger).toBeVisible();
      await searchTrigger.click();
      // The valueset search UI opens with its command input…
      await expect(
        page.locator('[data-slot="command-input"]').first(),
      ).toBeVisible();
      // …and after closing it the editor is still alive (regression guard:
      // the old coding editor crashed at this point when its FormFields
      // mounted without a FormProvider). The Coding tab is active, so the
      // search trigger is the visible editor surface.
      await page.keyboard.press("Escape");
      await expect(searchTrigger).toBeVisible();
    });

    await test.step("Select a code from the observation valueset", async () => {
      await selectFromValueSet(page, searchTrigger, { search: "heart" });
      // Codes come straight from the system observation valueset, so the
      // bound state is auto-verified: header summary + badge + bound row.
      await expect(page.getByText("Code Verified")).toBeVisible();
      await expect(page.getByText(/LOINC: \S+/)).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "Change" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Remove" })).toBeVisible();
    });
  });

  test("a question with every field set round-trips through save and reload", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const questionTitle = `Full question ${Date.now()}`;
    const helperText = `Helper ${faker.lorem.words(3)}`;
    const behaviourFlags = ["Required", "Repeatable", "Read only"];
    const captureFlags = [
      "Component",
      "Collect Time",
      "Collect Performer",
      "Collect Method",
      "Collect Body Site",
    ];
    const helperInput = page.getByRole("textbox", { name: /Helper text/ });
    const flag = (name: string) =>
      page.getByRole("checkbox", { name, exact: true });
    let detailUrl = "";

    await test.step("Author title, helper text and behaviour flags", async () => {
      detailUrl = await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Full Question ${Date.now()}`,
      });
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      await helperInput.fill(helperText);
      for (const name of behaviourFlags) {
        await flag(name).click();
        await expect(flag(name)).toHaveAttribute("aria-checked", "true");
      }
    });

    await test.step("Bind a code and every data-capture flag", async () => {
      await page.getByRole("tab", { name: "Coding" }).click();
      await selectFromValueSet(
        page,
        page.getByRole("combobox", { name: "Search for observation codes" }),
        { search: "heart" },
      );
      await expect(page.getByText("Code Verified")).toBeVisible();
      for (const name of captureFlags) {
        await flag(name).click();
        await expect(flag(name)).toHaveAttribute("aria-checked", "true");
      }
    });

    await test.step("Save", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("API: every field persisted on the question", async () => {
      const id = detailUrl.split("/").pop();
      const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/${id}/`, {
        headers: adminApiHeaders(),
      });
      expect(res.ok).toBe(true);
      const { questions } = (await res.json()) as {
        questions: Record<string, unknown>[];
      };
      expect(questions).toHaveLength(1);
      expect(questions[0]).toMatchObject({
        text: questionTitle,
        description: helperText,
        type: "string",
        required: true,
        repeats: true,
        read_only: true,
        is_component: true,
        collect_time: true,
        collect_performer: true,
        collect_method: true,
        collect_body_site: true,
        code: { code: expect.any(String) },
      });
    });

    await test.step("Full reload: the inspector shows every persisted field", async () => {
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(questionTitle);
      await expect(helperInput).toHaveValue(helperText);
      for (const name of behaviourFlags) {
        await expect(flag(name)).toHaveAttribute("aria-checked", "true");
      }
      await page.getByRole("tab", { name: "Coding" }).click();
      await expect(page.getByText("Code Verified")).toBeVisible();
      for (const name of captureFlags) {
        await expect(flag(name)).toHaveAttribute("aria-checked", "true");
      }
    });
  });
});
