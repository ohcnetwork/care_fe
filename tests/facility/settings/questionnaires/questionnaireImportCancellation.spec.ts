import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const DELAYED_URL = "https://questionnaire-fixtures.example/delayed.json";

interface DelayedImport {
  started: boolean;
  signal?: AbortSignal;
  finish: () => Promise<void>;
}

declare global {
  interface Window {
    delayedQuestionnaireImport?: DelayedImport;
  }
}

async function startDelayedImport(page: Page) {
  await page.addInitScript((url) => {
    const fetch = window.fetch.bind(window);
    const state: DelayedImport = { started: false, finish: async () => {} };
    window.delayedQuestionnaireImport = state;
    window.fetch = async (input, init) => {
      const requestedUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (requestedUrl !== url) return fetch(input, init);
      state.started = true;
      state.signal = init?.signal ?? undefined;
      const response = new Response(
        JSON.stringify({
          questions: [
            { text: "Stale URL question", type: "string", link_id: "stale" },
          ],
        }),
        { headers: { "content-type": "application/json" } },
      );
      const readText = response.text.bind(response);
      // Deliberately let body reading finish after abort. This verifies
      // stale-result protection as well as actual request cancellation.
      response.text = () =>
        new Promise<string>((resolve) => {
          state.finish = async () => resolve(await readText());
        });
      return response;
    };
  }, DELAYED_URL);

  await createQuestionnaireAndOpenBuilder(page, {
    basePath: `/facility/${getFacilityId()}/settings/questionnaires`,
    title: `Import cancellation ${Date.now()}`,
  });
  await page.getByRole("button", { name: "Import Questions" }).click();
  const dialog = page.getByRole("dialog", { name: "Import Questionnaire" });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Import from URL" }).click();
  await dialog
    .getByRole("textbox", { name: "Paste a questionnaire JSON URL" })
    .fill(DELAYED_URL);
  await dialog.getByRole("button", { name: "Import", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.delayedQuestionnaireImport?.started))
    .toBe(true);
  return dialog;
}

async function finishCancelledImport(page: Page) {
  expect(
    await page.evaluate(
      () => window.delayedQuestionnaireImport?.signal?.aborted,
    ),
  ).toBe(true);
  await page.evaluate(async () => {
    await window.delayedQuestionnaireImport?.finish();
    // Allow the response continuation and React's scheduled render to run
    // before inspecting the UI, including the old implementation's writes.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

test("cancelled URL imports cannot restore confirmation after reopening", async ({
  page,
}) => {
  const dialog = await startDelayedImport(page);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Import Questions" }).click();
  await finishCancelledImport(page);

  await expect(dialog.getByRole("combobox")).toHaveText(
    "Import from a JSON file",
  );
  await expect(dialog.getByText(/Question count/)).not.toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Import", exact: true }),
  ).toBeDisabled();
});

test("a delayed URL response cannot overwrite a newer file import", async ({
  page,
}) => {
  const dialog = await startDelayedImport(page);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Import from a JSON file" }).click();
  const questionTitle = `Selected file ${Date.now()}`;
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "selected.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        questions: [
          { text: questionTitle, type: "string", link_id: "file-one" },
          {
            text: "Another file question",
            type: "boolean",
            link_id: "file-two",
          },
        ],
      }),
    ),
  });
  await expect(dialog.getByText("Question count: 2")).toBeVisible();
  await finishCancelledImport(page);
  await expect(dialog.getByText("Question count: 2")).toBeVisible();
  await dialog.getByRole("button", { name: "Import", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Question Title" }),
  ).toHaveValue(questionTitle);
  await expect(page.getByText("Stale URL question")).not.toBeVisible();
});

test("editing a URL invalidates the response for the previous address", async ({
  page,
}) => {
  const dialog = await startDelayedImport(page);
  const urlInput = dialog.getByRole("textbox", {
    name: "Paste a questionnaire JSON URL",
  });
  await urlInput.fill(
    "https://questionnaire-fixtures.example/replacement.json",
  );
  await finishCancelledImport(page);

  await expect(urlInput).toHaveValue(
    "https://questionnaire-fixtures.example/replacement.json",
  );
  await expect(dialog.getByText(/Question count/)).not.toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Import", exact: true }),
  ).toBeEnabled();
});
