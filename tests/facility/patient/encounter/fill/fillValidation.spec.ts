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

test.describe("Fill page validation", () => {
  test("required questions block submit, scroll to the first error, and clear on edit", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const firstRequired = questionBlock(
      page,
      "Is bilateral air entry present?",
    );
    const firstRequiredGroup = firstRequired.getByRole("radiogroup");
    const modalityGroup = questionBlock(page, "Select Modality").getByRole(
      "radiogroup",
    );
    await expect(firstRequired).toBeVisible();

    // Submit empty: both required questions flag, first one scrolled into
    // view via its data-question-id anchor.
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      firstRequired.getByText("This field is required"),
    ).toBeVisible();
    await expect(
      questionBlock(page, "Select Modality").getByText(
        "This field is required",
      ),
    ).toBeVisible();
    await expect(firstRequired).toBeInViewport();
    await expect(firstRequiredGroup).toHaveAccessibleDescription(
      "This field is required",
    );
    await expect(firstRequiredGroup).toHaveAttribute("aria-invalid", "true");
    await expect(modalityGroup).toHaveAccessibleDescription(
      "This field is required",
    );

    // Editing the answer clears exactly that question's error.
    await firstRequired
      .getByRole("radio", { name: "yes", exact: true })
      .click();
    await expect(
      firstRequired.getByText("This field is required"),
    ).not.toBeVisible();
    await expect(firstRequiredGroup).toHaveAccessibleDescription("");
    await expect(firstRequiredGroup).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(modalityGroup).toHaveAccessibleDescription(
      "This field is required",
    );
    await expect(
      questionBlock(page, "Select Modality").getByText(
        "This field is required",
      ),
    ).toBeVisible();

    // Completing the second required question lets the submit through.
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "oxygen_support", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });
});
