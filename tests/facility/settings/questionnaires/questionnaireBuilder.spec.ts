import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
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
      // The title renders in the outline row and as the field label.
      await expect(page.getByText(questionTitle).first()).toBeVisible();
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
});
