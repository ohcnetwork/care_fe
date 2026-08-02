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
  test("answers survive a reload, discard resets, submit clears the draft", async ({
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

    // No draft yet — no Draft chip on the tab, no restore bar.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(note);

    // Any edit marks the session as a draft.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Reload — the pagehide flush persists the pending debounce, and the
    // fresh mount restores silently with the restore bar.
    await page.reload();
    await expect(page.getByText(/Restored your unsaved answers/)).toBeVisible();
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(note);
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        { name: "yes", exact: true },
      ),
    ).toHaveAttribute("aria-checked", "true");

    // Discard: pristine form, bar and chip gone.
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(
      page.getByText(/Restored your unsaved answers/),
    ).not.toBeVisible();
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue("");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

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
    await expect(
      page.getByText(/Restored your unsaved answers/),
    ).not.toBeVisible();
  });
});
