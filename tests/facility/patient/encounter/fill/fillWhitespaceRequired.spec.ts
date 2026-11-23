import { expect, test } from "@playwright/test";
import {
  checkVisibility,
  createQuestionnaireEncounter,
  submitForm,
} from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";
import { getQuestionnaireId } from "tests/support/questionnaireId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * A required string question answered with only spaces counts as
 * unanswered (`entryHasContent` in
 * `src/components/QuestionnaireV2/form/engine/inputs/answeredEntry.ts`),
 * so Save Changes shows the required error and submits nothing.
 *
 * Uses the enable-when fixture's "Self-Pay Reason" [required, string],
 * which renders while its source "Insurance Provider" is unanswered.
 */
test.describe("Fill page required text answers", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const questionnaireId = getQuestionnaireId();

    const submissions: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/v1/batch_requests/") &&
        (request.postData() ?? "").includes("/submit/")
      ) {
        submissions.push(request.url());
      }
    });

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaireId}`,
    );
    const fillUrl = page.url();

    const block = questionBlock(page, "Self-Pay Reason");
    const input = block.getByRole("textbox");

    await test.step("Answer the required question with only spaces", async () => {
      await checkVisibility(page, "Self-Pay Reason", true);
      await input.fill("   ");
      await expect(input).toHaveValue("   ");
    });

    await test.step("Saving shows the required error and submits nothing", async () => {
      await submitForm(page);
      const error = block.getByText("This field is required", { exact: true });
      await expect(error).toBeVisible();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(page).toHaveURL(fillUrl);
      expect(submissions).toHaveLength(0);
    });
  });
});
