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

// "Save as draft" writes a form_submission record and is feature-flagged
// (REACT_ENABLE_QUESTIONNAIRE_DRAFT), inlined into the bundle at build
// time — a build without it has no button to click.
const draftEnabled = process.env.REACT_ENABLE_QUESTIONNAIRE_DRAFT === "true";

test.describe("Fill page server draft", () => {
  test.skip(
    !draftEnabled,
    "REACT_ENABLE_QUESTIONNAIRE_DRAFT is off in this build",
  );

  test("Save as draft lists on the encounter overview, previews readonly, and Continue resumes it", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(note);

    await page.getByRole("button", { name: "Save as Draft" }).click();
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    // The encounter overview's drafts card is the server draft's consumer:
    // it previews the saved answers through the v2 renderer, readonly. The
    // only questionnaire block on this page belongs to that preview.
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).toBeVisible();
    const previewNote = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");
    await expect(previewNote).toHaveValue(note);
    await expect(previewNote).toBeDisabled();

    // Continue deep-links back with ?continue_draft= and the server copy
    // seeds the store.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/continue_draft=/);
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(note);
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        {
          name: "yes",
          exact: true,
        },
      ),
    ).toHaveAttribute("aria-checked", "true");

    // Submitting a resumed draft completes that same record, so the card
    // empties out again.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).not.toBeVisible();
  });
});
