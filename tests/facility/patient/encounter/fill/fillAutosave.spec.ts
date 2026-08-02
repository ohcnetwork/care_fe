import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Fill page local autosave", () => {
  test("reload prompts to resume, Resume applies the draft, submit clears it", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();
    const textInput = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");

    // No draft yet — no Draft chip on the tab, no prompt.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await textInput.fill(note);

    // Any edit marks the session as a draft.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Reload — the pagehide flush persists the pending debounce, but the
    // fresh mount must NOT silently seed the store: it prompts instead.
    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(textInput).toHaveValue("");
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        { name: "yes", exact: true },
      ),
    ).toHaveAttribute("aria-checked", "false");

    // Resume applies the draft into the live store.
    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue(note);
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        { name: "yes", exact: true },
      ),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Fill the required questions and submit — success clears the draft.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    // Back on the fill page: nothing to restore.
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
  });

  test("Discard deletes the draft, a later reload shows no prompt", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();
    const textInput = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await textInput.fill(note);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(textInput).toHaveValue("");

    // Discard: prompt gone, form stays pristine, chip gone.
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue("");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    // The draft was deleted, not merely dismissed — a later reload has
    // nothing left to prompt about.
    await page.reload();
    await expect(airEntry).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue("");
  });
});
