import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  createQuestionnaire,
  createQuestionnaireAndOpenBuilder,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const FAKE_URL = "https://questionnaire-fixtures.example/export.json";

async function openImportDialog(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await expect(
    page.getByRole("dialog", { name: "Import Questionnaire" }),
  ).toBeVisible();
}

async function switchToUrlMode(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Import from URL" }).click();
  await expect(
    dialog.getByRole("textbox", { name: "Paste a questionnaire JSON URL" }),
  ).toBeVisible();
}

test.describe("Questionnaire v2 import via URL and malformed payloads", () => {
  test("imports questions fetched from a URL", async ({ page }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const qOne = `${faker.word.words(2)} One ${stamp}`;
    const qTwo = `${faker.word.words(2)} Two ${stamp}`;

    await page.route(FAKE_URL, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          questions: [
            { text: qOne, type: "string", link_id: "u1" },
            { text: qTwo, type: "boolean", link_id: "u2" },
          ],
        }),
      }),
    );

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Url Import ${stamp}`,
    });
    await openImportDialog(page);
    await switchToUrlMode(page);

    const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });

    await test.step("Fetch, confirm and apply", async () => {
      await dialog
        .getByRole("textbox", { name: "Paste a questionnaire JSON URL" })
        .fill(FAKE_URL);
      await dialog.getByRole("button", { name: "Import", exact: true }).click();
      await expect(dialog.getByText("Question count: 2")).toBeVisible();
      await dialog.getByRole("button", { name: "Import", exact: true }).click();
      await expectToast(page, "Questionnaire Imported Successfully");
    });

    await test.step("The fetched questions landed in the builder", async () => {
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(qOne);
      await expect(
        page.getByRole("navigation").getByRole("button", { name: qTwo }),
      ).toBeVisible();
    });
  });

  test("a non-http(s) URL is rejected inline without fetching", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Bad Url ${Date.now()}`,
    });
    await openImportDialog(page);
    await switchToUrlMode(page);

    const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
    await dialog
      .getByRole("textbox", { name: "Paste a questionnaire JSON URL" })
      .fill("ftp://example.com/questionnaire.json");
    await dialog.getByRole("button", { name: "Import", exact: true }).click();

    await expect(dialog.getByText("Please enter a valid url")).toBeVisible();
    // Still on the select step — no confirm summary appeared.
    await expect(dialog.getByText(/Question count/)).not.toBeVisible();
  });

  test("a fetched payload with an unknown question type is rejected", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await page.route(FAKE_URL, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          questions: [{ text: "Bad", type: "radio", link_id: "x" }],
        }),
      }),
    );

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Bad Type ${Date.now()}`,
    });
    await openImportDialog(page);
    await switchToUrlMode(page);

    const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
    await dialog
      .getByRole("textbox", { name: "Paste a questionnaire JSON URL" })
      .fill(FAKE_URL);
    await dialog.getByRole("button", { name: "Import", exact: true }).click();

    await expectToast(
      page,
      "Invalid JSON: please check the format and try again",
    );
    await expect(dialog.getByText(/Question count/)).not.toBeVisible();
  });

  test("a malformed JSON file shows the inline dropzone error", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Bad File ${Date.now()}`,
    });
    await openImportDialog(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from("{not valid json"),
    });

    const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
    await expect(
      dialog.getByText("Invalid JSON: please check the format and try again"),
    ).toBeVisible();
  });

  test("confirm step supports Back, and Cancel leaves the draft untouched", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Import Cancel ${Date.now()}`,
    });
    await openImportDialog(page);

    const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });

    await test.step("Reach the confirm step", async () => {
      await page.locator('input[type="file"]').setInputFiles({
        name: "ok.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            questions: [{ text: "Discarded", type: "string", link_id: "d" }],
          }),
        ),
      });
      await expect(dialog.getByText("Question count: 1")).toBeVisible();
    });

    await test.step("Back returns to the picker", async () => {
      await dialog.getByRole("button", { name: "Back" }).click();
      await expect(
        dialog.getByText("Drag and drop file here or click to upload"),
      ).toBeVisible();
    });

    await test.step("Cancel closes without touching the empty draft", async () => {
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add First Question" }),
      ).toBeVisible();
      await expect(page.getByText("Discarded")).not.toBeVisible();
    });
  });

  test("the detail page's Import quick action deep-links with ?import=1", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaire(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Import Deep Link ${Date.now()}`,
    });

    await test.step("The empty-state Import action opens the builder dialog", async () => {
      await page.getByRole("button", { name: "Import Questions" }).click();
      await expect(
        page.getByRole("dialog", { name: "Import Questionnaire" }),
      ).toBeVisible();
    });

    await test.step("The import param is stripped so refresh won't reopen", async () => {
      await expect(page).toHaveURL(/\/edit$/);
      await page.reload();
      await expect(
        page.getByRole("dialog", { name: "Import Questionnaire" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add First Question" }),
      ).toBeVisible();
    });
  });
});

test.describe("Questionnaire v2 import replaces an existing draft", () => {
  test("importing over saved questions replaces them after confirm", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const original = `Original ${stamp}`;
    const replacement = `Replacement ${stamp}`;

    await test.step("Author and save one question", async () => {
      await createQuestionnaire(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Replace ${stamp}`,
      });
      await openQuestionBuilder(page);
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(original);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Import a different question over it", async () => {
      // With questions present the Import affordance lives on the detail
      // page (quick action) — deep-link straight into the dialog.
      await page.goto(page.url().replace(/\/edit$/, "/edit?import=1"));
      const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
      await expect(dialog).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles({
        name: "replacement.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            questions: [{ text: replacement, type: "string", link_id: "r" }],
          }),
        ),
      });
      await expect(
        dialog.getByText("All existing data will be replaced"),
      ).toBeVisible();
      await dialog.getByRole("button", { name: "Import", exact: true }).click();
      await expectToast(page, "Questionnaire Imported Successfully");
    });

    await test.step("The draft now holds only the replacement", async () => {
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(replacement);
      await expect(page.getByText(original)).not.toBeVisible();
    });
  });
});
