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
  test("Shift+Enter validates required questions and submits only from the active form", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const submissions: {
      requests: {
        url: string;
        body: { results?: { values: { value?: unknown }[] }[] };
      }[];
    }[] = [];
    await page.route("**/api/v1/batch_requests/", async (route) => {
      const body = route.request().postDataJSON();
      if (
        !body.requests.some((request: { url: string }) =>
          request.url.includes("/submit/"),
        )
      ) {
        return route.fallback();
      }
      submissions.push(body);
      // This case owns keyboard dispatch and client validation. Backend
      // acceptance remains covered by the value-serialization scenarios.
      await route.fulfill({ json: { results: [] } });
    });
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

    const noteInput = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");
    const save = page.getByRole("button", {
      name: "Save Changes",
      exact: true,
    });
    await expect(save).toHaveAttribute("aria-keyshortcuts", "Shift+Enter");

    // The shortcut also submits from a focused field; validation still
    // blocks missing answers and brings the first error into view.
    await noteInput.focus();
    await noteInput.press("Shift+Enter");
    await expect(
      firstRequired.getByText("This field is required"),
    ).toBeVisible();
    await expect(
      questionBlock(page, "Select Modality").getByText(
        "This field is required",
      ),
    ).toBeVisible();
    await expect(firstRequired).toBeInViewport();
    expect(submissions).toHaveLength(0);
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

    // Completing the second required question makes the form submittable.
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "oxygen_support", exact: true })
      .click();
    const note = `Keyboard note ${Date.now()}`;
    await noteInput.fill(note);
    await noteInput.press("End");
    await noteInput.press("Enter");
    await noteInput.pressSequentially("Latest answer");
    const expectedNote = `${note}\nLatest answer`;
    await expect(noteInput).toHaveValue(expectedNote);

    // Hidden forms and visible pickers must not submit the ready answers.
    await page.getByRole("tab", { name: "Patient Clinical History" }).click();
    await page.keyboard.press("Shift+Enter");
    await expect(
      page.getByRole("tab", { name: "Responses", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: /^Questionnaire/ }).click();
    await page.getByRole("button", { name: "Add questionnaire" }).click();
    const forms = page.getByRole("dialog", { name: "Forms", exact: true });
    await forms.getByPlaceholder("Search Forms").press("Shift+Enter");
    await expect(forms).toBeVisible();
    await forms.getByPlaceholder("Search Forms").press("Escape");
    await expect(forms).not.toBeVisible();
    expect(submissions).toHaveLength(0);

    await noteInput.press("Shift+Enter");
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    expect(submissions).toHaveLength(1);
    const submit = submissions[0].requests.find(
      (request) =>
        request.url === `/api/v1/questionnaire/${questionnaireId}/submit/`,
    );
    expect(submit).toBeDefined();
    expect(
      (submit?.body.results ?? []).flatMap((result) =>
        result.values.map((value) => value.value),
      ),
    ).toContain(expectedNote);
  });
});
