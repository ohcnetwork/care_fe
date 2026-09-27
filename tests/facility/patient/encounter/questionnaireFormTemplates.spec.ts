import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function createTemplateForm() {
  const suffix = faker.string.alphanumeric(8).toLowerCase();
  const response = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title: `Form template round trip ${suffix}`,
      slug: `template-e2e-${suffix}`,
      version: "1.0",
      status: "active",
      subject_type: "encounter",
      auth_context: "instance",
      organizations: [],
      actions: [],
      questions: [
        { link_id: "reason", text: "Visit reason", type: "string" },
        { link_id: "red_flags", text: "Red flags present?", type: "boolean" },
        { link_id: "pain", text: "Pain score", type: "integer" },
        { link_id: "note", text: "Patient note", type: "text" },
      ].map((question) => ({ id: crypto.randomUUID(), ...question })),
    }),
  });
  expect(response.ok, `Create test form: ${response.status}`).toBe(true);
  return ((await response.json()) as { id: string }).id;
}

async function previewSavedTemplate(page: Page, name: string) {
  await page.getByRole("button", { name: "Use template", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByPlaceholder("Search templates").fill(name);
  await sheet.getByRole("button").filter({ hasText: name }).click();
  return sheet;
}

test("saved form templates survive a fresh session and apply only their selected answers", async ({
  page,
  browser,
  baseURL,
}) => {
  // This is the persistence/renderer boundary: helper tests cannot catch an
  // API round-trip dropping values or a template applying to the wrong store.
  // Create only this test's form/template; never submit a clinical response.
  const questionnaireId = await createTemplateForm();
  const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
  const templateName = `Follow-up ${faker.string.alphanumeric(10)}`;
  const templateReason = "Routine follow-up";
  const currentReason = "A different reason for today's visit";
  const currentNote = "Keep this patient's individual note";

  await test.step("Save selected answers, including false and zero, through the real API", async () => {
    await page.goto(fillUrl);
    await questionBlock(page, "Visit reason")
      .getByRole("textbox")
      .fill(templateReason);
    await questionBlock(page, "Red flags present?")
      .getByRole("radio", { name: "No", exact: true })
      .click();
    await questionBlock(page, "Pain score").getByRole("spinbutton").fill("0");
    await questionBlock(page, "Patient note")
      .getByRole("textbox")
      .fill("This source patient's note must not become a template answer");

    await page
      .getByRole("button", { name: "Save as template", exact: true })
      .click();
    const sheet = page.getByRole("dialog");
    await sheet
      .getByRole("textbox", { name: "Template name" })
      .fill(templateName);
    await sheet.getByRole("checkbox", { name: /Patient note/ }).uncheck();

    const saved = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v1/questionnaire_response_template/" &&
        response.request().method() === "POST",
    );
    await sheet
      .getByRole("button", { name: "Save template", exact: true })
      .click();
    expect((await saved).ok(), "Template POST must persist successfully").toBe(
      true,
    );
    await expect(sheet).not.toBeVisible();
    await expect(
      questionBlock(page, "Patient note").getByRole("textbox"),
    ).toHaveValue(
      "This source patient's note must not become a template answer",
    );
  });

  // Reusing the original context would allow an optimistic cache or a local
  // patient draft to masquerade as a persisted, reusable form template.
  const freshContext = await browser.newContext({
    storageState: "tests/.auth/user.json",
    baseURL,
  });
  const reopened = await freshContext.newPage();
  try {
    await test.step("Fetch the saved template in a fresh session and preserve existing answers by default", async () => {
      await reopened.goto(fillUrl);
      const reason = questionBlock(reopened, "Visit reason").getByRole(
        "textbox",
      );
      const note = questionBlock(reopened, "Patient note").getByRole("textbox");
      const pain = questionBlock(reopened, "Pain score").getByRole(
        "spinbutton",
      );
      await expect(reason).toHaveValue("");
      await expect(pain).toHaveValue("");
      await reason.fill(currentReason);
      await note.fill(currentNote);

      const preview = await previewSavedTemplate(reopened, templateName);
      await expect(
        preview.getByRole("radio", { name: /^Fill empty answers/ }),
      ).toBeChecked();
      await preview
        .getByRole("button", { name: "Apply template", exact: true })
        .click();
      await expect(preview).not.toBeVisible();
      await expect(reason).toHaveValue(currentReason);
      await expect(note).toHaveValue(currentNote);
      await expect(pain).toHaveValue("0");
      await expect(
        questionBlock(reopened, "Red flags present?").getByRole("radio", {
          name: "No",
          exact: true,
        }),
      ).toBeChecked();
    });

    await test.step("Explicit replacement changes saved fields and retains the unselected patient note", async () => {
      await questionBlock(reopened, "Red flags present?")
        .getByRole("radio", { name: "Yes", exact: true })
        .click();
      await questionBlock(reopened, "Pain score")
        .getByRole("spinbutton")
        .fill("5");
      const preview = await previewSavedTemplate(reopened, templateName);
      await preview
        .getByRole("radio", { name: /^Replace saved answers/ })
        .click();
      await preview
        .getByRole("button", { name: "Apply template", exact: true })
        .click();
      await expect(preview).not.toBeVisible();

      await expect(
        questionBlock(reopened, "Visit reason").getByRole("textbox"),
      ).toHaveValue(templateReason);
      await expect(
        questionBlock(reopened, "Pain score").getByRole("spinbutton"),
      ).toHaveValue("0");
      await expect(
        questionBlock(reopened, "Red flags present?").getByRole("radio", {
          name: "No",
          exact: true,
        }),
      ).toBeChecked();
      await expect(
        questionBlock(reopened, "Patient note").getByRole("textbox"),
      ).toHaveValue(currentNote);
    });
  } finally {
    await freshContext.close();
  }
});
